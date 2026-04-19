import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Slice 5 — VC Strategic Cockpit & Draft Agenda Approval
 *
 * Per Section 2.4 of board_governance_spec.docx:
 * "The VC views the proposed agenda with DSS context per item: feeder-body trail,
 *  financial impact summary, precedent decisions, risk flags, suggested ordering.
 *  The VC can reorder, defer to next meeting, return to proposer with comments,
 *  or approve. All actions are logged for traceability."
 *
 * Per Section 5.2: Precedent retrieval for each VETTED item
 * Per Section 5.3: Implication analysis (rule-based classifier)
 * Per Section 5.4: Quorum and conflict checks
 */

// ─── Implication keywords (shared with triage, duplicated for independence) ───
const IMPLICATION_RULES: Record<string, { keywords: string[]; label: string; severity: "high" | "medium" | "low" }> = {
  financial: {
    keywords: ["budget", "expenditure", "cost", "funding", "allocation", "revenue", "fee", "salary", "stipend", "grant", "financial", "fiscal", "procurement", "tender", "PKR", "Rs", "million", "remuneration", "honorarium", "allowance"],
    label: "Financial",
    severity: "high",
  },
  legal: {
    keywords: ["legal", "statute", "ordinance", "regulation", "compliance", "court", "litigation", "tribunal", "disciplinary", "contract", "agreement", "MoU", "liability", "HEC directive", "regulatory"],
    label: "Legal/Regulatory",
    severity: "high",
  },
  hr: {
    keywords: ["appointment", "promotion", "transfer", "termination", "recruitment", "designation", "tenure", "probation", "leave", "deputation", "pension", "BPS", "faculty position", "vacancy"],
    label: "HR",
    severity: "medium",
  },
  academic: {
    keywords: ["curriculum", "programme", "degree", "semester", "examination", "admission", "syllabus", "credit hour", "research", "thesis", "accreditation", "QEC"],
    label: "Academic",
    severity: "medium",
  },
};

function detectImplications(item: any): { type: string; label: string; severity: string }[] {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
  const text = [item.title, descData.background, descData.issueForConsideration, descData.proposedResolution].filter(Boolean).join(" ").toLowerCase();
  const flags: any[] = [];
  for (const [type, rule] of Object.entries(IMPLICATION_RULES)) {
    if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      flags.push({ type, label: rule.label, severity: rule.severity });
    }
  }
  return flags;
}

async function findPrecedentsForItem(item: any) {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const pastItems = await prisma.agendaItem.findMany({
    where: { id: { not: item.id }, createdAt: { gte: cutoff }, status: { in: ["DECIDED", "CLOSED", "APPROVED_FOR_AGENDA", "CIRCULATED"] } },
    include: { meetingCalendar: { select: { meetingNumber: true, meetingDate: true } }, decisions: { select: { decisionText: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const titleWords = item.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const results: any[] = [];
  for (const past of pastItems) {
    const pastWords = past.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const overlap = titleWords.filter((w: string) => pastWords.includes(w)).length;
    let pastDesc: any = {};
    try { pastDesc = JSON.parse(past.description || "{}"); } catch {}
    const catMatch = descData.category && pastDesc.category && descData.category === pastDesc.category;
    const sim = (titleWords.length > 0 ? overlap / titleWords.length : 0) + (catMatch ? 0.2 : 0);
    if (sim >= 0.25) {
      results.push({
        id: past.id, title: past.title, status: past.status,
        meetingNumber: past.meetingCalendar?.meetingNumber,
        meetingDate: past.meetingCalendar?.meetingDate,
        outcome: past.decisions?.[0]?.decisionText || null,
        similarity: Math.min(Math.round(sim * 100), 100),
      });
    }
  }
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

function computeCompletenessScore(item: any): number {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
  const fields = ["title", "background", "issueForConsideration", "proposedResolution", "proposedBy"];
  let filled = 0;
  for (const f of fields) {
    if ((item[f] || descData[f]) && String(item[f] || descData[f]).trim().length > 0) filled++;
  }
  return Math.round((filled / fields.length) * 100);
}

/**
 * Suggest optimal agenda ordering per Section 5 intelligence engine
 * Priority: items with financial/legal flags first, then by completeness (desc), then by item number
 */
function suggestOrdering(items: any[]): any[] {
  return [...items].sort((a, b) => {
    const aFlags = (a.implications || []).filter((i: any) => i.severity === "high").length;
    const bFlags = (b.implications || []).filter((i: any) => i.severity === "high").length;
    if (bFlags !== aFlags) return bFlags - aFlags;
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    return a.itemNumber - b.itemNumber;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/board/vc-cockpit — VC's draft agenda view
// Returns VETTED items for a meeting, enriched with DSS context
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");

    // Get meetings with vetted items for selection
    const meetingsWithVetted = await prisma.meetingCalendar.findMany({
      where: {
        agendaItems: { some: { status: { in: ["VETTED", "APPROVED_FOR_AGENDA"] } } },
      },
      select: {
        id: true, title: true, meetingNumber: true, meetingDate: true,
        meetingLocation: true, status: true, quorum: true,
        _count: { select: { agendaItems: { where: { status: { in: ["VETTED", "APPROVED_FOR_AGENDA"] } } } } },
      },
      orderBy: { meetingDate: "desc" },
    });

    if (!meetingId) {
      // Return meeting list for selection
      return NextResponse.json({ meetings: meetingsWithVetted, items: [], stats: null });
    }

    // Get meeting details
    const meeting = await prisma.meetingCalendar.findUnique({
      where: { id: meetingId },
      include: {
        apceEvents: { orderBy: { scheduledAt: "asc" } },
      },
    });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Get vetted + approved items for this meeting
    const items = await prisma.agendaItem.findMany({
      where: {
        meetingCalendarId: meetingId,
        status: { in: ["VETTED", "APPROVED_FOR_AGENDA", "DEFERRED", "RETURNED"] },
      },
      include: {
        resolutions: true,
        decisions: true,
      },
      orderBy: { itemNumber: "asc" },
    });

    // Enrich each item with DSS intelligence
    const enrichedItems = await Promise.all(items.map(async (item) => {
      let descData: any = {};
      try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

      const implications = detectImplications(item);
      const precedents = await findPrecedentsForItem(item);
      const completeness = computeCompletenessScore(item);

      // Feeder body trail
      const feederTrail = item.resolutions.map(r => ({
        bodyCode: r.bodyCode,
        resolutionNumber: r.resolutionNumber,
        text: r.resolutionText?.substring(0, 120),
      }));

      return {
        ...item,
        category: descData.category || "other",
        background: descData.background || "",
        issueForConsideration: descData.issueForConsideration || "",
        proposedResolution: descData.proposedResolution || "",
        feederResolutionRef: descData.feederResolutionRef || null,
        implications,
        precedents,
        completeness,
        feederTrail,
        hasFinancialFlag: implications.some(i => i.type === "financial"),
        hasLegalFlag: implications.some(i => i.type === "legal"),
        riskLevel: implications.filter(i => i.severity === "high").length >= 2 ? "high" :
                   implications.filter(i => i.severity === "high").length === 1 ? "medium" : "low",
      };
    }));

    // Suggested ordering
    const suggestedOrder = suggestOrdering(enrichedItems);

    // Cockpit stats
    const stats = {
      totalItems: enrichedItems.length,
      vetted: enrichedItems.filter(i => i.status === "VETTED").length,
      approved: enrichedItems.filter(i => i.status === "APPROVED_FOR_AGENDA").length,
      deferred: enrichedItems.filter(i => i.status === "DEFERRED").length,
      returned: enrichedItems.filter(i => i.status === "RETURNED").length,
      financialFlags: enrichedItems.filter(i => i.hasFinancialFlag).length,
      legalFlags: enrichedItems.filter(i => i.hasLegalFlag).length,
      highRisk: enrichedItems.filter(i => i.riskLevel === "high").length,
      avgCompleteness: enrichedItems.length > 0
        ? Math.round(enrichedItems.reduce((s, i) => s + i.completeness, 0) / enrichedItems.length) : 0,
      meetingDate: meeting.meetingDate,
      meetingStatus: meeting.status,
      upcomingEvents: meeting.apceEvents
        .filter(e => e.status === "PENDING" && new Date(e.scheduledAt) > new Date())
        .slice(0, 3)
        .map(e => ({ code: e.eventCode, name: e.eventName, scheduledAt: e.scheduledAt })),
    };

    return NextResponse.json({
      meeting,
      meetings: meetingsWithVetted,
      items: enrichedItems,
      suggestedOrder: suggestedOrder.map(i => i.id),
      stats,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch VC cockpit data");
    return NextResponse.json({ error: "Failed to fetch VC cockpit data" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/board/vc-cockpit — VC actions on agenda items
// Actions: approve, defer, return, reorder, approve_agenda (bulk)
// ═══════════════════════════════════════════════════════════════════════════════
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      // ─── Approve single item for agenda ───
      case "approve_item": {
        const { id, notes } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        const item = await prisma.agendaItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
        if (item.status !== "VETTED") {
          return NextResponse.json({ error: "Only VETTED items can be approved for agenda" }, { status: 400 });
        }

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: { status: "APPROVED_FOR_AGENDA" },
        });

        await prisma.inAppNotification.create({
          data: {
            recipientRole: "REGISTRAR",
            title: "Item Approved for Agenda",
            message: `VC approved "${item.title}" for the meeting agenda.${notes ? ` Note: ${notes}` : ""}`,
            type: "success",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "approve_item" }, "VC approved item for agenda");
        return NextResponse.json({ item: updated, action: "approved" });
      }

      // ─── Defer item to next meeting ───
      case "defer": {
        const { id, notes, targetMeetingId } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        const item = await prisma.agendaItem.findUnique({
          where: { id },
          include: { meetingCalendar: true },
        });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
        if (!["VETTED", "APPROVED_FOR_AGENDA"].includes(item.status)) {
          return NextResponse.json({ error: "Only VETTED or APPROVED items can be deferred" }, { status: 400 });
        }

        // Find or use specified target meeting
        let nextMeetingId = targetMeetingId;
        if (!nextMeetingId) {
          const nextMeeting = await prisma.meetingCalendar.findFirst({
            where: {
              meetingDate: { gt: item.meetingCalendar.meetingDate },
              status: { in: ["DRAFT", "SCHEDULED", "CALL_ISSUED", "SUBMISSIONS_OPEN"] },
            },
            orderBy: { meetingDate: "asc" },
          });
          nextMeetingId = nextMeeting?.id;
        }

        // Store deferral info in description
        let descData: any = {};
        try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
        if (!descData.deferralHistory) descData.deferralHistory = [];
        descData.deferralHistory.push({
          fromMeetingId: item.meetingCalendarId,
          toMeetingId: nextMeetingId || "TBD",
          deferredAt: new Date().toISOString(),
          reason: notes || "Deferred by VC",
        });

        const updateData: any = {
          status: "DEFERRED",
          description: JSON.stringify(descData),
        };

        // If target meeting found, move the item
        if (nextMeetingId) {
          updateData.meetingCalendarId = nextMeetingId;
          updateData.status = "VETTED"; // Re-enter as VETTED in new meeting
        }

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: updateData,
        });

        // Notify Registrar and Proposer
        await prisma.inAppNotification.create({
          data: {
            recipientRole: "REGISTRAR",
            title: "Item Deferred",
            message: `VC deferred "${item.title}" to ${nextMeetingId ? "next meeting" : "a future meeting"}.${notes ? ` Reason: ${notes}` : ""}`,
            type: "warning",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        await prisma.inAppNotification.create({
          data: {
            recipientRole: "AUTHORIZED_PROPOSER",
            title: "Your Item Has Been Deferred",
            message: `"${item.title}" has been deferred by the Vice Chancellor.${notes ? ` Reason: ${notes}` : ""}`,
            type: "warning",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "defer", targetMeetingId: nextMeetingId }, "VC deferred item");
        return NextResponse.json({ item: updated, action: "deferred", movedToMeeting: nextMeetingId });
      }

      // ─── Return to proposer with VC comments ───
      case "return": {
        const { id, notes } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
        if (!notes) return NextResponse.json({ error: "notes (reason) required when returning" }, { status: 400 });

        const item = await prisma.agendaItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        let descData: any = {};
        try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
        descData.vcReturnReason = notes;
        descData.vcReturnedAt = new Date().toISOString();

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: { status: "DRAFT", description: JSON.stringify(descData) },
        });

        await prisma.inAppNotification.create({
          data: {
            recipientRole: "AUTHORIZED_PROPOSER",
            title: "Item Returned by VC",
            message: `"${item.title}" returned by Vice Chancellor. Reason: ${notes}`,
            type: "warning",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "return" }, "VC returned item to proposer");
        return NextResponse.json({ item: updated, action: "returned" });
      }

      // ─── Reorder items (set agenda sequence) ───
      case "reorder": {
        const { meetingId, orderedIds } = body;
        if (!meetingId || !orderedIds || !Array.isArray(orderedIds)) {
          return NextResponse.json({ error: "meetingId and orderedIds[] required" }, { status: 400 });
        }

        // Update item numbers according to new order
        const updates = orderedIds.map((id: string, index: number) =>
          prisma.agendaItem.update({
            where: { id },
            data: { itemNumber: index + 1 },
          })
        );
        await Promise.all(updates);

        logger.info({ meetingId, count: orderedIds.length }, "VC reordered agenda items");
        return NextResponse.json({ action: "reordered", count: orderedIds.length });
      }

      // ─── Approve entire agenda (bulk) ───
      case "approve_agenda": {
        const { meetingId, notes } = body;
        if (!meetingId) return NextResponse.json({ error: "meetingId is required" }, { status: 400 });

        const meeting = await prisma.meetingCalendar.findUnique({ where: { id: meetingId } });
        if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

        // Approve all VETTED items
        const result = await prisma.agendaItem.updateMany({
          where: { meetingCalendarId: meetingId, status: "VETTED" },
          data: { status: "APPROVED_FOR_AGENDA" },
        });

        // Update meeting status to AGENDA_APPROVED
        await prisma.meetingCalendar.update({
          where: { id: meetingId },
          data: { status: "AGENDA_APPROVED" },
        });

        // Notify Registrar to begin working paper preparation
        await prisma.inAppNotification.create({
          data: {
            recipientRole: "REGISTRAR",
            title: "Agenda Approved by VC",
            message: `The Vice Chancellor has approved the agenda for ${meeting.title || `Meeting #${meeting.meetingNumber}`} with ${result.count} items. Working paper preparation may begin.${notes ? ` VC Note: ${notes}` : ""}`,
            type: "success",
            meetingCalendarId: meetingId,
          },
        });

        logger.info({ meetingId, itemsApproved: result.count }, "VC approved full agenda");
        return NextResponse.json({
          action: "agenda_approved",
          itemsApproved: result.count,
          meetingStatus: "AGENDA_APPROVED",
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Valid: approve_item, defer, return, reorder, approve_agenda` }, { status: 400 });
    }
  } catch (error) {
    logger.error({ error }, "Failed to process VC cockpit action");
    return NextResponse.json({ error: "Failed to process VC cockpit action" }, { status: 500 });
  }
}
