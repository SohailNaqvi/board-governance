import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Slice 7 — Member Portal (Syndicate member side)
 *
 * Per Section 2.6 of board_governance_spec.docx:
 * "Each Syndicate member receives a personal portal showing all circulated
 *  papers for the upcoming meeting. Members acknowledge reading each paper
 *  (read receipt), can submit pre-meeting queries, and RSVP attendance."
 *
 * Endpoints:
 *   GET  — Member's view: circulated papers, read status, queries, meeting info
 *   POST — Mark paper as read, submit query, RSVP
 */

// GET /api/board/member-portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const meetingId = searchParams.get("meetingId");
    const queryId = searchParams.get("queryId");

    // If no memberId, list all active members (for selection UI)
    if (!memberId) {
      const members = await prisma.syndicateMember.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, memberNumber: true, department: true, email: true },
        orderBy: { name: "asc" },
      });

      // List meetings with circulated papers
      const meetings = await prisma.meetingCalendar.findMany({
        where: { status: { in: ["PAPERS_CIRCULATED", "IN_SESSION"] } },
        select: {
          id: true, title: true, meetingNumber: true, meetingDate: true, status: true,
          meetingLocation: true, onlineMeetingLink: true,
          _count: { select: { workingPapers: true } },
        },
        orderBy: { meetingDate: "desc" },
      });

      return NextResponse.json({ members, meetings });
    }

    // Verify member exists
    const member = await prisma.syndicateMember.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, memberNumber: true, department: true, email: true, status: true },
    });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (member.status !== "ACTIVE") return NextResponse.json({ error: "Member is inactive" }, { status: 403 });

    // Single query detail
    if (queryId) {
      const query = await prisma.memberQuery.findUnique({
        where: { id: queryId },
        include: { syndicateMember: { select: { id: true, name: true } } },
      });
      if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });
      return NextResponse.json({ query });
    }

    // Get meetings with circulated papers
    const meetingsFilter: any = { status: { in: ["PAPERS_CIRCULATED", "IN_SESSION"] } };
    if (meetingId) meetingsFilter.id = meetingId;

    const meetings = await prisma.meetingCalendar.findMany({
      where: meetingsFilter,
      select: {
        id: true, title: true, meetingNumber: true, meetingDate: true, status: true,
        meetingLocation: true, onlineMeetingLink: true, circulationAt: true, queryCloseAt: true,
      },
      orderBy: { meetingDate: "desc" },
    });

    if (meetingId) {
      const meeting = meetings[0];
      if (!meeting) return NextResponse.json({ error: "Meeting not found or papers not yet circulated" }, { status: 404 });

      // Get circulated papers with this member's read status
      const papers = await prisma.workingPaper.findMany({
        where: { meetingCalendarId: meetingId, status: "CIRCULATED" },
        include: {
          agendaItem: {
            select: {
              id: true, title: true, itemNumber: true, status: true, proposedBy: true,
              description: true,
            },
          },
          readReceipts: { where: { syndicateMemberId: memberId } },
          _count: { select: { annexures: true } },
        },
        orderBy: { agendaItem: { itemNumber: "asc" } },
      });

      const enrichedPapers = papers.map(p => {
        let descData: any = {};
        try { descData = JSON.parse(p.agendaItem?.description || "{}"); } catch {}
        let sections: any = {};
        try { sections = JSON.parse(p.content || "{}"); } catch {}
        const hasRead = p.readReceipts.length > 0;
        const readAt = hasRead ? p.readReceipts[0].readAt : null;

        return {
          id: p.id,
          title: p.agendaItem?.title || p.title,
          itemNumber: p.agendaItem?.itemNumber,
          category: descData.category || "General",
          proposedBy: p.agendaItem?.proposedBy,
          status: p.status,
          hasRead,
          readAt,
          annexureCount: p._count.annexures,
          sections: {
            itemReference: sections.itemReference || "",
            background: sections.background || "",
            issueForConsideration: sections.issueForConsideration || "",
            financialImplications: sections.financialImplications || "",
            legalImplications: sections.legalImplications || "",
            priorDecisions: sections.priorDecisions || "",
            analysis: sections.analysis || "",
            proposedResolution: sections.proposedResolution || "",
            recommendations: sections.recommendations || "",
            feederBodyResolution: sections.feederBodyResolution || "",
            annexures: sections.annexures || "",
          },
        };
      });

      // Member's queries for this meeting period
      const queries = await prisma.memberQuery.findMany({
        where: { syndicateMemberId: memberId },
        orderBy: { queryDate: "desc" },
        take: 50,
      });

      const readCount = enrichedPapers.filter(p => p.hasRead).length;
      const queriesOpen = queries.filter(q => q.status === "OPEN").length;
      const queriesAnswered = queries.filter(q => q.status === "ANSWERED").length;

      // Check if queries are still open (before query close date)
      const queryCloseDate = meeting.queryCloseAt ? new Date(meeting.queryCloseAt) : null;
      const queriesAccepted = queryCloseDate ? new Date() < queryCloseDate : true;

      return NextResponse.json({
        member,
        meeting,
        papers: enrichedPapers,
        queries,
        stats: {
          totalPapers: enrichedPapers.length,
          papersRead: readCount,
          readPercent: enrichedPapers.length > 0 ? Math.round((readCount / enrichedPapers.length) * 100) : 0,
          queriesOpen,
          queriesAnswered,
          queriesAccepted,
        },
      });
    }

    // No meetingId: return meetings overview per member
    const readReceipts = await prisma.readReceipt.findMany({
      where: { syndicateMemberId: memberId },
      select: { workingPaperId: true, readAt: true },
    });
    const queryCounts = await prisma.memberQuery.groupBy({
      by: ["status"],
      where: { syndicateMemberId: memberId },
      _count: { id: true },
    });

    return NextResponse.json({
      member,
      meetings,
      totalPapersRead: readReceipts.length,
      queryCounts,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch member portal data");
    return NextResponse.json({ error: "Failed to fetch member portal data" }, { status: 500 });
  }
}

// POST /api/board/member-portal — Mark read, submit query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, memberId } = body;

    if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });

    const member = await prisma.syndicateMember.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (member.status !== "ACTIVE") return NextResponse.json({ error: "Member is inactive" }, { status: 403 });

    if (action === "mark_read") {
      const { paperId } = body;
      if (!paperId) return NextResponse.json({ error: "paperId is required" }, { status: 400 });

      const paper = await prisma.workingPaper.findUnique({ where: { id: paperId } });
      if (!paper) return NextResponse.json({ error: "Working paper not found" }, { status: 404 });
      if (paper.status !== "CIRCULATED") {
        return NextResponse.json({ error: `Paper is not circulated. Status: ${paper.status}` }, { status: 400 });
      }

      // Check if already read
      const existing = await prisma.readReceipt.findUnique({
        where: { workingPaperId_syndicateMemberId: { workingPaperId: paperId, syndicateMemberId: memberId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Already marked as read", readReceipt: existing }, { status: 409 });
      }

      const receipt = await prisma.readReceipt.create({
        data: { workingPaperId: paperId, syndicateMemberId: memberId, readAt: new Date() },
        include: { workingPaper: { select: { title: true } }, syndicateMember: { select: { name: true } } },
      });

      logger.info({ memberId, paperId }, "Read receipt created");
      return NextResponse.json({ readReceipt: receipt, action: "marked_read" }, { status: 201 });
    }

    if (action === "mark_read_bulk") {
      const { paperIds } = body;
      if (!Array.isArray(paperIds) || paperIds.length === 0) {
        return NextResponse.json({ error: "paperIds array is required" }, { status: 400 });
      }

      const results: any[] = [];
      for (const paperId of paperIds) {
        const existing = await prisma.readReceipt.findUnique({
          where: { workingPaperId_syndicateMemberId: { workingPaperId: paperId, syndicateMemberId: memberId } },
        });
        if (!existing) {
          const receipt = await prisma.readReceipt.create({
            data: { workingPaperId: paperId, syndicateMemberId: memberId, readAt: new Date() },
          });
          results.push({ paperId, status: "created", receipt });
        } else {
          results.push({ paperId, status: "already_read" });
        }
      }
      return NextResponse.json({ results, action: "bulk_marked_read" });
    }

    if (action === "submit_query") {
      const { queryText } = body;
      if (!queryText || queryText.trim().length < 10) {
        return NextResponse.json({ error: "queryText must be at least 10 characters" }, { status: 400 });
      }

      const query = await prisma.memberQuery.create({
        data: { syndicateMemberId: memberId, queryText: queryText.trim(), queryDate: new Date(), status: "OPEN" },
        include: { syndicateMember: { select: { name: true, memberNumber: true } } },
      });

      // Notify Registrar
      await prisma.inAppNotification.create({
        data: {
          recipientRole: "REGISTRAR",
          title: "Pre-Meeting Query Received",
          message: `${member.name} submitted a query: "${queryText.slice(0, 80)}${queryText.length > 80 ? "..." : ""}"`,
          type: "action",
        },
      });

      logger.info({ memberId, queryId: query.id }, "Member query submitted");
      return NextResponse.json({ query, action: "query_submitted" }, { status: 201 });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error({ error }, "Failed to process member portal action");
    return NextResponse.json({ error: "Failed to process member portal action" }, { status: 500 });
  }
}
