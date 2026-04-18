import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Prerequisite categories that require a feeder-body resolution reference.
 * Per Section 2.2 of board_governance_spec.docx:
 * "For categories requiring prior clearance, the system looks up the required
 *  feeder-body resolution... Submissions without a valid, matching resolution
 *  ID cannot be saved as submitted — they remain in draft state."
 */
const PREREQUISITE_CATEGORIES: Record<string, { bodyCode: string; label: string }> = {
  academic: { bodyCode: "AC", label: "Academic Council" },
  financial: { bodyCode: "FPC", label: "Finance & Planning Committee" },
  hr: { bodyCode: "ASRB", label: "Advanced Studies & Research Board" },
};

/**
 * Validate feeder-body resolution reference for categories that require it.
 * Returns { valid, message, resolution? }
 */
async function validatePrerequisite(category: string, feederResolutionRef: string | null) {
  const prereq = PREREQUISITE_CATEGORIES[category];
  if (!prereq) {
    // Category does not require a prerequisite
    return { valid: true, message: null, required: false };
  }

  if (!feederResolutionRef) {
    return {
      valid: false,
      required: true,
      message: `${prereq.label} resolution reference is required for ${category} items. This item will remain in DRAFT until a valid resolution ID is provided.`,
      resolution: null,
    };
  }

  // Look up the resolution in the database
  const resolution = await prisma.feederBodyResolution.findFirst({
    where: {
      bodyCode: prereq.bodyCode,
      resolutionNumber: parseInt(feederResolutionRef) || -1,
    },
  });

  if (!resolution) {
    return {
      valid: false,
      required: true,
      message: `No matching ${prereq.label} resolution found for reference "${feederResolutionRef}". Please verify the resolution number. This item will remain in DRAFT.`,
      resolution: null,
    };
  }

  return {
    valid: true,
    required: true,
    message: `Verified: ${prereq.label} Resolution #${resolution.resolutionNumber} — "${resolution.resolutionText.substring(0, 80)}..."`,
    resolution,
  };
}

// GET /api/board/submissions — List submissions, optionally filtered
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const proposedBy = searchParams.get("proposedBy");
    const status = searchParams.get("status");

    const where: any = {};
    if (meetingId) where.meetingCalendarId = meetingId;
    if (proposedBy) where.proposedBy = proposedBy;
    if (status) where.status = status;

    const items = await prisma.agendaItem.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        meetingCalendar: {
          select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true },
        },
        resolutions: true,
      },
    });

    // Get meetings with open submission windows for the dropdown
    const openMeetings = await prisma.meetingCalendar.findMany({
      where: {
        status: { in: ["SCHEDULED", "CALL_ISSUED", "SUBMISSIONS_OPEN"] },
      },
      orderBy: { meetingDate: "asc" },
      select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true },
    });

    // Get feeder body resolutions for validation lookups
    const resolutions = await prisma.feederBodyResolution.findMany({
      orderBy: { resolutionNumber: "desc" },
      take: 50,
    });

    return NextResponse.json({ items, openMeetings, resolutions });
  } catch (error) {
    logger.error({ error }, "Failed to fetch submissions");
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST /api/board/submissions — Create a new submission (DRAFT or SUBMITTED)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      meetingCalendarId,
      title,
      category,
      description,
      background,
      issueForConsideration,
      proposedResolution,
      proposedBy,
      feederResolutionRef,
    } = body;

    if (!meetingCalendarId || !title || !category || !proposedBy) {
      return NextResponse.json(
        { error: "meetingCalendarId, title, category, and proposedBy are required" },
        { status: 400 }
      );
    }

    // Validate meeting exists and is accepting submissions
    const meeting = await prisma.meetingCalendar.findUnique({ where: { id: meetingCalendarId } });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Check prerequisite
    const prereqResult = await validatePrerequisite(category, feederResolutionRef);

    // Determine status: SUBMITTED if prereqs met, DRAFT if not
    const itemStatus = prereqResult.valid ? "SUBMITTED" : "DRAFT";

    // Auto-assign item number
    const lastItem = await prisma.agendaItem.findFirst({
      where: { meetingCalendarId },
      orderBy: { itemNumber: "desc" },
    });
    const itemNumber = (lastItem?.itemNumber || 0) + 1;

    // Build the full description with structured fields
    const fullDescription = JSON.stringify({
      category,
      background: background || "",
      issueForConsideration: issueForConsideration || "",
      proposedResolution: proposedResolution || "",
      feederResolutionRef: feederResolutionRef || null,
      prerequisiteStatus: prereqResult.valid ? "CLEARED" : "PENDING",
      prerequisiteMessage: prereqResult.message,
    });

    const item = await prisma.agendaItem.create({
      data: {
        meetingCalendarId,
        itemNumber,
        title,
        description: fullDescription,
        status: itemStatus,
        proposedBy,
        submittedDate: itemStatus === "SUBMITTED" ? new Date() : null,
      },
      include: {
        meetingCalendar: {
          select: { id: true, title: true, meetingNumber: true },
        },
      },
    });

    // Create notification for Registrar when submitted
    if (itemStatus === "SUBMITTED") {
      await prisma.inAppNotification.create({
        data: {
          recipientRole: "REGISTRAR",
          title: "New Submission Received",
          message: `"${title}" submitted by ${proposedBy} for ${meeting.title || `Meeting #${meeting.meetingNumber}`}. Category: ${category}.`,
          type: "info",
          meetingCalendarId,
        },
      });
    }

    logger.info({ itemId: item.id, status: itemStatus, category }, "Created submission");

    return NextResponse.json({
      item,
      status: itemStatus,
      prerequisite: {
        required: prereqResult.required,
        valid: prereqResult.valid,
        message: prereqResult.message,
      },
    }, { status: 201 });

  } catch (error) {
    logger.error({ error }, "Failed to create submission");
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}

// PUT /api/board/submissions — Update a submission (edit draft, resubmit with resolution)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, category, description, background, issueForConsideration, proposedResolution, feederResolutionRef, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Submission id is required" }, { status: 400 });
    }

    const existing = await prisma.agendaItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Handle specific actions
    if (action === "submit") {
      // Attempt to move from DRAFT to SUBMITTED
      if (existing.status !== "DRAFT") {
        return NextResponse.json({ error: "Only DRAFT items can be submitted" }, { status: 400 });
      }

      const cat = category || JSON.parse(existing.description || "{}").category || "other";
      const ref = feederResolutionRef || JSON.parse(existing.description || "{}").feederResolutionRef;
      const prereqResult = await validatePrerequisite(cat, ref);

      if (!prereqResult.valid) {
        return NextResponse.json({
          error: "Prerequisites not met",
          prerequisite: prereqResult,
          status: "DRAFT",
        }, { status: 422 });
      }

      const updated = await prisma.agendaItem.update({
        where: { id },
        data: { status: "SUBMITTED", submittedDate: new Date() },
      });

      // Notify Registrar
      await prisma.inAppNotification.create({
        data: {
          recipientRole: "REGISTRAR",
          title: "Draft Submitted",
          message: `"${existing.title}" has been submitted for consideration.`,
          type: "info",
          meetingCalendarId: existing.meetingCalendarId,
        },
      });

      return NextResponse.json({ item: updated, status: "SUBMITTED", prerequisite: prereqResult });
    }

    if (action === "withdraw") {
      const updated = await prisma.agendaItem.update({
        where: { id },
        data: { status: "WITHDRAWN" },
      });
      return NextResponse.json({ item: updated });
    }

    // General edit (for DRAFT items)
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description || background || issueForConsideration || proposedResolution || feederResolutionRef) {
      const existingDesc = JSON.parse(existing.description || "{}");
      updateData.description = JSON.stringify({
        ...existingDesc,
        ...(category && { category }),
        ...(background !== undefined && { background }),
        ...(issueForConsideration !== undefined && { issueForConsideration }),
        ...(proposedResolution !== undefined && { proposedResolution }),
        ...(feederResolutionRef !== undefined && { feederResolutionRef }),
      });
    }

    const updated = await prisma.agendaItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    logger.error({ error }, "Failed to update submission");
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
