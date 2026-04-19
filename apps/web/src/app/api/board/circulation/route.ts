import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Slice 7 — Circulation & Member Portal (Registrar side)
 *
 * Per Section 2.6 of board_governance_spec.docx:
 * "Once all working papers are finalized, the Registrar circulates the
 *  complete agenda pack to Syndicate members (T-7). Each member's portal
 *  shows papers to read, provides read-receipt tracking, and allows
 *  pre-meeting queries. The Registrar monitors circulation coverage."
 *
 * Circulation lifecycle:
 *   FINALIZED papers → bulk CIRCULATE → member portal opens
 *   Meeting status: AGENDA_APPROVED → PAPERS_CIRCULATED
 *   AgendaItem status for circulated items: APPROVED_FOR_AGENDA → CIRCULATED
 *
 * Endpoints:
 *   GET  — Circulation dashboard: papers by meeting, read receipt stats, member engagement
 *   POST — Circulate papers for a meeting (bulk transition)
 *   PUT  — Manage members, respond to queries
 */

// GET /api/board/circulation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const view = searchParams.get("view"); // "members" | "queries" | "coverage"

    // List meetings eligible for circulation
    const meetings = await prisma.meetingCalendar.findMany({
      where: {
        status: { in: ["AGENDA_APPROVED", "PAPERS_CIRCULATED", "IN_SESSION", "CONCLUDED"] },
      },
      select: {
        id: true, title: true, meetingNumber: true, meetingDate: true, status: true,
        _count: { select: { workingPapers: true, agendaItems: true } },
      },
      orderBy: { meetingDate: "desc" },
    });

    if (!meetingId) {
      return NextResponse.json({ meetings });
    }

    // Get meeting detail
    const meeting = await prisma.meetingCalendar.findUnique({
      where: { id: meetingId },
      select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true, circulationAt: true },
    });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    // Papers for this meeting
    const papers = await prisma.workingPaper.findMany({
      where: { meetingCalendarId: meetingId },
      include: {
        agendaItem: { select: { id: true, title: true, itemNumber: true, status: true, proposedBy: true, description: true } },
        readReceipts: { include: { syndicateMember: { select: { id: true, name: true, memberNumber: true } } } },
        _count: { select: { readReceipts: true, annexures: true } },
      },
      orderBy: { agendaItem: { itemNumber: "asc" } },
    });

    // All active members
    const members = await prisma.syndicateMember.findMany({
      where: { status: "ACTIVE" },
      include: {
        readReceipts: { where: { workingPaper: { meetingCalendarId: meetingId } } },
        memberQueries: { where: { createdAt: { gte: meeting.meetingDate ? new Date(new Date(meeting.meetingDate).getTime() - 30 * 86400000) : new Date(0) } } },
      },
      orderBy: { name: "asc" },
    });

    // Queries for this meeting's papers
    const paperIds = papers.map(p => p.id);
    const queries = await prisma.memberQuery.findMany({
      where: { syndicateMember: { status: "ACTIVE" } },
      include: { syndicateMember: { select: { id: true, name: true, memberNumber: true } } },
      orderBy: { queryDate: "desc" },
      take: 100,
    });

    // Compute stats
    const totalPapers = papers.length;
    const circulatedPapers = papers.filter(p => p.status === "CIRCULATED").length;
    const finalizedPapers = papers.filter(p => p.status === "FINALIZED").length;
    const totalMembers = members.length;
    const totalReadReceipts = papers.reduce((sum, p) => sum + p._count.readReceipts, 0);
    const maxPossibleReads = totalPapers * totalMembers;
    const overallCoverage = maxPossibleReads > 0 ? Math.round((totalReadReceipts / maxPossibleReads) * 100) : 0;

    // Per-paper coverage
    const paperCoverage = papers.map(p => ({
      paperId: p.id,
      title: p.agendaItem?.title || p.title,
      itemNumber: p.agendaItem?.itemNumber,
      status: p.status,
      readCount: p._count.readReceipts,
      totalMembers,
      coveragePercent: totalMembers > 0 ? Math.round((p._count.readReceipts / totalMembers) * 100) : 0,
      readers: p.readReceipts.map(rr => ({ memberName: rr.syndicateMember.name, memberNumber: rr.syndicateMember.memberNumber, readAt: rr.readAt })),
    }));

    // Per-member engagement
    const memberEngagement = members.map(m => ({
      memberId: m.id,
      name: m.name,
      memberNumber: m.memberNumber,
      department: m.department,
      papersRead: m.readReceipts.length,
      totalPapers: circulatedPapers,
      readPercent: circulatedPapers > 0 ? Math.round((m.readReceipts.length / circulatedPapers) * 100) : 0,
      queriesSubmitted: m.memberQueries.length,
    }));

    // Open queries
    const openQueries = queries.filter(q => q.status === "OPEN").length;
    const answeredQueries = queries.filter(q => q.status === "ANSWERED").length;

    const stats = {
      totalPapers,
      finalizedPapers,
      circulatedPapers,
      totalMembers,
      totalReadReceipts,
      overallCoverage,
      openQueries,
      answeredQueries,
      readyToCirculate: finalizedPapers > 0 && circulatedPapers === 0,
      allCirculated: circulatedPapers === totalPapers && totalPapers > 0,
    };

    return NextResponse.json({
      meeting,
      meetings,
      papers: paperCoverage,
      members: memberEngagement,
      queries,
      stats,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch circulation data");
    return NextResponse.json({ error: "Failed to fetch circulation data" }, { status: 500 });
  }
}

// POST /api/board/circulation — Circulate papers for a meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, action } = body;

    if (action === "add_member") {
      // Add a new syndicate member
      const { name, email, memberNumber, department } = body;
      if (!name || !email || !memberNumber) {
        return NextResponse.json({ error: "name, email, and memberNumber are required" }, { status: 400 });
      }
      const existing = await prisma.syndicateMember.findFirst({
        where: { OR: [{ email }, { memberNumber }] },
      });
      if (existing) {
        return NextResponse.json({ error: "Member with this email or memberNumber already exists" }, { status: 409 });
      }
      const member = await prisma.syndicateMember.create({
        data: { name, email, memberNumber, department: department || null, joinDate: new Date(), status: "ACTIVE" },
      });
      return NextResponse.json({ member, action: "member_added" }, { status: 201 });
    }

    if (!meetingId) return NextResponse.json({ error: "meetingId is required" }, { status: 400 });

    const meeting = await prisma.meetingCalendar.findUnique({ where: { id: meetingId } });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    if (action === "circulate") {
      // Bulk circulate: all FINALIZED papers → CIRCULATED
      if (meeting.status !== "AGENDA_APPROVED" && meeting.status !== "PAPERS_CIRCULATED") {
        return NextResponse.json({ error: `Meeting must be in AGENDA_APPROVED or PAPERS_CIRCULATED status. Current: ${meeting.status}` }, { status: 400 });
      }

      const finalizedPapers = await prisma.workingPaper.findMany({
        where: { meetingCalendarId: meetingId, status: "FINALIZED" },
        include: { agendaItem: { select: { id: true, title: true, itemNumber: true } } },
      });

      if (finalizedPapers.length === 0) {
        return NextResponse.json({ error: "No FINALIZED papers to circulate" }, { status: 400 });
      }

      // Transition papers to CIRCULATED
      const paperIds = finalizedPapers.map(p => p.id);
      await prisma.workingPaper.updateMany({
        where: { id: { in: paperIds } },
        data: { status: "CIRCULATED" },
      });

      // Transition agenda items to CIRCULATED
      const itemIds = finalizedPapers.map(p => p.agendaItem?.id).filter(Boolean) as string[];
      if (itemIds.length > 0) {
        await prisma.agendaItem.updateMany({
          where: { id: { in: itemIds }, status: "APPROVED_FOR_AGENDA" },
          data: { status: "CIRCULATED" },
        });
      }

      // Update meeting status
      await prisma.meetingCalendar.update({
        where: { id: meetingId },
        data: { status: "PAPERS_CIRCULATED", circulationAt: new Date() },
      });

      // Notify all syndicate members
      await prisma.inAppNotification.create({
        data: {
          recipientRole: "SYNDICATE_MEMBER",
          title: "Agenda Papers Circulated",
          message: `${finalizedPapers.length} working papers for Meeting #${meeting.meetingNumber} have been circulated. Please review before the meeting.`,
          type: "action",
          meetingCalendarId: meetingId,
        },
      });

      // Also notify VC
      await prisma.inAppNotification.create({
        data: {
          recipientRole: "VICE_CHANCELLOR",
          title: "Papers Circulated",
          message: `Agenda pack for Meeting #${meeting.meetingNumber} circulated to all members.`,
          type: "success",
          meetingCalendarId: meetingId,
        },
      });

      // Trigger the APCE Circulation event if it exists
      const circulationEvent = await prisma.aPCEEvent.findFirst({
        where: { meetingCalendarId: meetingId, eventCode: "CIRCULATION" },
      });
      if (circulationEvent) {
        await prisma.aPCEEvent.update({
          where: { id: circulationEvent.id },
          data: { status: "COMPLETED", triggeredAt: new Date() },
        });
      }

      logger.info({ meetingId, papersCirculated: finalizedPapers.length }, "Papers circulated");
      return NextResponse.json({
        action: "circulated",
        papersCirculated: finalizedPapers.length,
        meetingStatus: "PAPERS_CIRCULATED",
        papers: finalizedPapers.map(p => ({ id: p.id, title: p.agendaItem?.title || p.title, itemNumber: p.agendaItem?.itemNumber })),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error({ error }, "Failed to circulate papers");
    return NextResponse.json({ error: "Failed to circulate papers" }, { status: 500 });
  }
}

// PUT /api/board/circulation — Respond to query, manage members
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "respond_query") {
      const { queryId, responseText, respondedBy } = body;
      if (!queryId || !responseText) {
        return NextResponse.json({ error: "queryId and responseText are required" }, { status: 400 });
      }
      const query = await prisma.memberQuery.findUnique({ where: { id: queryId } });
      if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });
      if (query.status === "ANSWERED") {
        return NextResponse.json({ error: "Query already answered" }, { status: 400 });
      }
      const updated = await prisma.memberQuery.update({
        where: { id: queryId },
        data: { responseText, responseDate: new Date(), status: "ANSWERED" },
      });
      return NextResponse.json({ query: updated, action: "query_answered" });
    }

    if (action === "deactivate_member") {
      const { memberId } = body;
      if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
      const member = await prisma.syndicateMember.findUnique({ where: { id: memberId } });
      if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
      const updated = await prisma.syndicateMember.update({
        where: { id: memberId },
        data: { status: "INACTIVE" },
      });
      return NextResponse.json({ member: updated, action: "member_deactivated" });
    }

    if (action === "activate_member") {
      const { memberId } = body;
      if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
      const updated = await prisma.syndicateMember.update({
        where: { id: memberId },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({ member: updated, action: "member_activated" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error({ error }, "Failed to update circulation");
    return NextResponse.json({ error: "Failed to update circulation" }, { status: 500 });
  }
}
