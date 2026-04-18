import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

// GET /api/board/apce-events — List APCE events, optionally filtered by meeting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");

    const where: any = {};
    if (meetingId) where.meetingCalendarId = meetingId;

    const events = await prisma.aPCEEvent.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        meetingCalendar: {
          select: { id: true, title: true, meetingNumber: true, meetingDate: true },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    logger.error({ error }, "Failed to fetch APCE events");
    return NextResponse.json({ error: "Failed to fetch APCE events" }, { status: 500 });
  }
}

// PUT /api/board/apce-events — Update an APCE event status (trigger, complete, skip)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "TRIGGERED", "COMPLETED", "SKIPPED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const event = await prisma.aPCEEvent.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "APCE event not found" }, { status: 404 });
    }

    const updateData: any = { status };
    if (status === "TRIGGERED") {
      updateData.triggeredAt = new Date();
    }

    const updated = await prisma.aPCEEvent.update({
      where: { id },
      data: updateData,
      include: {
        meetingCalendar: { select: { id: true, title: true, meetingNumber: true } },
      },
    });

    // Generate notification when event is triggered
    if (status === "TRIGGERED") {
      const roleMap: Record<string, string[]> = {
        "MEETING_SCHEDULED": ["REGISTRAR", "VICE_CHANCELLOR"],
        "SUBMISSION_REMINDER": ["AUTHORIZED_PROPOSER"],
        "SUBMISSION_CUTOFF": ["AUTHORIZED_PROPOSER", "REGISTRAR"],
        "VC_AGENDA_APPROVAL_DUE": ["VICE_CHANCELLOR"],
        "CIRCULATION": ["SYNDICATE_MEMBER"],
        "PRE_MEETING_QUERY_CLOSE": ["SYNDICATE_MEMBER"],
        "MEETING_CONCLUDED": ["REGISTRAR"],
        "MINUTES_DRAFT_DUE": ["REGISTRAR", "VICE_CHANCELLOR"],
        "MINUTES_CONFIRMATION": ["REGISTRAR"],
        "ATR_REVIEW": ["VICE_CHANCELLOR", "REGISTRAR"],
      };

      const roles = roleMap[event.eventCode] || ["REGISTRAR"];
      for (const role of roles) {
        await prisma.inAppNotification.create({
          data: {
            recipientRole: role as any,
            title: `APCE: ${event.eventName}`,
            message: event.description || `${event.eventName} has been triggered for meeting #${updated.meetingCalendar?.meetingNumber}.`,
            type: "warning",
            apceEventId: event.id,
            meetingCalendarId: event.meetingCalendarId,
          },
        });
      }
    }

    logger.info({ eventId: id, status }, "Updated APCE event status");
    return NextResponse.json({ event: updated });
  } catch (error) {
    logger.error({ error }, "Failed to update APCE event");
    return NextResponse.json({ error: "Failed to update APCE event" }, { status: 500 });
  }
}
