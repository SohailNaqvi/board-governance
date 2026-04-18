import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * APCE Event Definitions — 10 events derived backward from meeting date
 * Per Section 7 of board_governance_spec.docx
 */
const APCE_EVENT_DEFINITIONS = [
  { eventCode: "MEETING_SCHEDULED", eventName: "Meeting Scheduled", offsetDays: 0, description: "Syndicate meeting date confirmed. Call notice issued to authorized proposers; submission window opens." },
  { eventCode: "SUBMISSION_REMINDER", eventName: "Submission Reminder", offsetDays: -21, description: "Reminder to authorized proposers with pending drafts." },
  { eventCode: "SUBMISSION_CUTOFF", eventName: "Submission Cut-off", offsetDays: -14, description: "Close submission window. DRAFT items marked LAPSED unless extended." },
  { eventCode: "VC_AGENDA_APPROVAL_DUE", eventName: "VC Agenda Approval Due", offsetDays: -10, description: "Notify VC that draft agenda is ready. Notify Registrar if not prepared." },
  { eventCode: "CIRCULATION", eventName: "Working Papers Circulation", offsetDays: -7, description: "Release finalized working papers to member portal. Notify members." },
  { eventCode: "PRE_MEETING_QUERY_CLOSE", eventName: "Pre-Meeting Query Close", offsetDays: -1, description: "Close pre-meeting query window." },
  { eventCode: "MEETING_CONCLUDED", eventName: "Meeting Concluded", offsetDays: 0, description: "Open minutes drafting workspace." },
  { eventCode: "MINUTES_DRAFT_DUE", eventName: "Minutes Draft Due", offsetDays: 7, description: "Remind Registrar. Escalate to VC if overdue." },
  { eventCode: "MINUTES_CONFIRMATION", eventName: "Minutes Confirmation", offsetDays: -14, description: "Minutes placed on next meeting agenda for confirmation. (Relative to NEXT meeting.)" },
  { eventCode: "ATR_REVIEW", eventName: "ATR Weekly Review", offsetDays: 7, description: "Weekly cockpit refresh of overdue ATR entries." },
];

/** Compute APCE event scheduled dates from a meeting date */
function computeAPCEEvents(meetingDate: Date, meetingId: string) {
  return APCE_EVENT_DEFINITIONS.map(def => {
    const scheduled = new Date(meetingDate);
    // MEETING_CONCLUDED fires on meeting day (T+0), but the flag is post-meeting
    if (def.eventCode === "MEETING_CONCLUDED") {
      // Same day as meeting, but conceptually after the meeting ends
      scheduled.setHours(18, 0, 0, 0);
    } else {
      scheduled.setDate(scheduled.getDate() + def.offsetDays);
      scheduled.setHours(9, 0, 0, 0); // Default to 9 AM
    }
    return {
      meetingCalendarId: meetingId,
      eventCode: def.eventCode,
      eventName: def.eventName,
      scheduledAt: scheduled,
      offsetDays: def.offsetDays,
      description: def.description,
      status: "PENDING" as const,
    };
  });
}

/** Compute derived deadline fields for a MeetingCalendar from meeting date */
function computeDeadlines(meetingDate: Date) {
  const d = (offset: number) => {
    const dt = new Date(meetingDate);
    dt.setDate(dt.getDate() + offset);
    dt.setHours(9, 0, 0, 0);
    return dt;
  };
  return {
    callNoticeAt: d(-28),        // 4 weeks before
    cutoffAt: d(-14),            // 2 weeks before
    vcApprovalDueAt: d(-10),     // 10 days before
    circulationAt: d(-7),        // 1 week before
    queryCloseAt: d(-1),         // 1 day before
    minutesDraftDueAt: d(7),     // 1 week after
    minutesConfirmAt: d(90),     // ~next meeting (placeholder)
  };
}

/** Generate notifications for relevant roles when APCE events are created */
function generateNotifications(meetingTitle: string, meetingDate: Date, apceEvents: { eventCode: string; eventName: string; scheduledAt: Date }[]) {
  const notifications: { recipientRole: string; title: string; message: string; type: string }[] = [];
  const dateStr = meetingDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Notify all proposer roles about the new meeting
  notifications.push({
    recipientRole: "AUTHORIZED_PROPOSER",
    title: "New Meeting Scheduled",
    message: `${meetingTitle} has been scheduled for ${dateStr}. Submission window is now open.`,
    type: "info",
  });

  // Notify Registrar
  notifications.push({
    recipientRole: "REGISTRAR",
    title: "Meeting Calendar Updated",
    message: `${meetingTitle} scheduled for ${dateStr}. ${apceEvents.length} APCE events generated.`,
    type: "info",
  });

  // Notify VC
  notifications.push({
    recipientRole: "VICE_CHANCELLOR",
    title: "New Syndicate Meeting",
    message: `${meetingTitle} is scheduled for ${dateStr}. Agenda approval will be due ${apceEvents.find(e => e.eventCode === "VC_AGENDA_APPROVAL_DUE")?.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "TBD"}.`,
    type: "info",
  });

  // Notify Syndicate Members
  notifications.push({
    recipientRole: "SYNDICATE_MEMBER",
    title: "Upcoming Syndicate Meeting",
    message: `${meetingTitle} is scheduled for ${dateStr}. Working papers will be circulated 7 days before the meeting.`,
    type: "info",
  });

  return notifications;
}

// GET /api/board/calendar — List all meetings with APCE events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeEvents = searchParams.get("includeEvents") !== "false";

    const meetings = await prisma.meetingCalendar.findMany({
      orderBy: { meetingDate: "desc" },
      include: {
        agendaItems: { select: { id: true, status: true } },
        ...(includeEvents ? { apceEvents: { orderBy: { scheduledAt: "asc" } } } : {}),
      },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    logger.error({ error }, "Failed to fetch meeting calendar");
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

// POST /api/board/calendar — Create a new meeting with auto-generated APCE events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, meetingDate, meetingLocation, onlineMeetingLink, quorum } = body;

    if (!meetingDate) {
      return NextResponse.json({ error: "meetingDate is required" }, { status: 400 });
    }

    const parsedDate = new Date(meetingDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid meetingDate" }, { status: 400 });
    }

    // Auto-assign meeting number
    const lastMeeting = await prisma.meetingCalendar.findFirst({ orderBy: { meetingNumber: "desc" } });
    const meetingNumber = (lastMeeting?.meetingNumber || 0) + 1;

    const deadlines = computeDeadlines(parsedDate);
    const meetingTitle = title || `${meetingNumber}th Meeting of the Syndicate`;

    // Create meeting
    const meeting = await prisma.meetingCalendar.create({
      data: {
        meetingNumber,
        title: meetingTitle,
        meetingDate: parsedDate,
        meetingLocation: meetingLocation || null,
        onlineMeetingLink: onlineMeetingLink || null,
        quorum: quorum || null,
        status: "SCHEDULED",
        ...deadlines,
      },
    });

    // Generate and insert APCE events
    const apceEventData = computeAPCEEvents(parsedDate, meeting.id);
    await prisma.aPCEEvent.createMany({ data: apceEventData });

    // Fetch the created events
    const apceEvents = await prisma.aPCEEvent.findMany({
      where: { meetingCalendarId: meeting.id },
      orderBy: { scheduledAt: "asc" },
    });

    // Generate notifications
    const notifData = generateNotifications(meetingTitle, parsedDate, apceEvents);
    for (const n of notifData) {
      await prisma.inAppNotification.create({
        data: {
          recipientRole: n.recipientRole as any,
          title: n.title,
          message: n.message,
          type: n.type,
          meetingCalendarId: meeting.id,
        },
      });
    }

    logger.info({ meetingId: meeting.id, meetingNumber, apceCount: apceEvents.length }, "Created meeting with APCE events");

    return NextResponse.json({
      meeting,
      apceEvents,
      notificationCount: notifData.length,
    }, { status: 201 });

  } catch (error) {
    logger.error({ error }, "Failed to create meeting");
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}

// PUT /api/board/calendar — Update meeting details and recompute APCE if date changed
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, meetingDate, meetingLocation, onlineMeetingLink, quorum, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Meeting id is required" }, { status: 400 });
    }

    const existing = await prisma.meetingCalendar.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (meetingLocation !== undefined) updateData.meetingLocation = meetingLocation;
    if (onlineMeetingLink !== undefined) updateData.onlineMeetingLink = onlineMeetingLink;
    if (quorum !== undefined) updateData.quorum = quorum;
    if (status !== undefined) updateData.status = status;

    // If date changed, recompute deadlines and APCE events
    if (meetingDate) {
      const parsedDate = new Date(meetingDate);
      if (!isNaN(parsedDate.getTime())) {
        updateData.meetingDate = parsedDate;
        Object.assign(updateData, computeDeadlines(parsedDate));

        // Delete old APCE events and recreate
        await prisma.aPCEEvent.deleteMany({ where: { meetingCalendarId: id } });
        const newEvents = computeAPCEEvents(parsedDate, id);
        await prisma.aPCEEvent.createMany({ data: newEvents });

        // Notify about date change
        await prisma.inAppNotification.create({
          data: {
            recipientRole: "AUTHORIZED_PROPOSER",
            title: "Meeting Date Changed",
            message: `Meeting date updated to ${parsedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. All deadlines recomputed.`,
            type: "warning",
            meetingCalendarId: id,
          },
        });
      }
    }

    const updated = await prisma.meetingCalendar.update({
      where: { id },
      data: updateData,
      include: { apceEvents: { orderBy: { scheduledAt: "asc" } } },
    });

    return NextResponse.json({ meeting: updated });
  } catch (error) {
    logger.error({ error }, "Failed to update meeting");
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}

// DELETE /api/board/calendar — Delete a meeting and its APCE events
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Meeting id is required" }, { status: 400 });
    }

    await prisma.meetingCalendar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete meeting");
    return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 });
  }
}
