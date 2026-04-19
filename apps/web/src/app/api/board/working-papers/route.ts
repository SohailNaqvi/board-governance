import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Slice 6 — Working Paper Authoring & Auto-Population
 *
 * Per Section 2.5 of board_governance_spec.docx:
 * "A working paper is instantiated from the standard template. The system
 *  auto-populates feeder-body resolution text, financial data, relevant CV
 *  extracts, and prior related decisions from the data warehouse. Registrar
 *  staff complete narrative sections. The paper passes through a review-and-
 *  sign-off workflow before finalization."
 *
 * WorkingPaper lifecycle: INSTANTIATED → IN_AUTHORING → IN_REVIEW → FINALIZED → CIRCULATED → ARCHIVED
 */

const TEMPLATE_SECTIONS = [
  { key: "itemReference", label: "Item Reference", required: true, autoPopulate: true },
  { key: "feederBodyResolution", label: "Feeder Body Resolution", required: false, autoPopulate: true },
  { key: "background", label: "Background & Context", required: true, autoPopulate: true },
  { key: "issueForConsideration", label: "Issue for Consideration", required: true, autoPopulate: true },
  { key: "financialImplications", label: "Financial Implications", required: false, autoPopulate: true },
  { key: "legalImplications", label: "Legal & Regulatory Implications", required: false, autoPopulate: false },
  { key: "priorDecisions", label: "Prior Related Decisions", required: false, autoPopulate: true },
  { key: "analysis", label: "Analysis & Discussion", required: true, autoPopulate: false },
  { key: "proposedResolution", label: "Proposed Resolution", required: true, autoPopulate: true },
  { key: "recommendations", label: "Recommendations", required: true, autoPopulate: false },
  { key: "annexures", label: "List of Annexures", required: false, autoPopulate: false },
];

async function autoPopulateSections(agendaItem: any) {
  let descData: any = {};
  try { descData = JSON.parse(agendaItem.description || "{}"); } catch { descData = {}; }
  const sections: Record<string, string> = {};

  sections.itemReference = `Agenda Item #${agendaItem.itemNumber}: ${agendaItem.title}\n` +
    `Meeting: ${agendaItem.meetingCalendar?.title || "Meeting #" + agendaItem.meetingCalendar?.meetingNumber}\n` +
    `Date: ${agendaItem.meetingCalendar?.meetingDate ? new Date(agendaItem.meetingCalendar.meetingDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD"}\n` +
    `Proposed by: ${agendaItem.proposedBy}\nCategory: ${descData.category || "General"}`;

  if (agendaItem.resolutions && agendaItem.resolutions.length > 0) {
    sections.feederBodyResolution = agendaItem.resolutions.map((r: any) =>
      `${r.bodyCode} Resolution #${r.resolutionNumber}:\n"${r.resolutionText}"`
    ).join("\n\n");
  } else if (descData.feederResolutionRef) {
    sections.feederBodyResolution = `Reference: ${descData.feederResolutionRef} (details to be verified)`;
  }

  if (descData.background) sections.background = descData.background;
  if (descData.issueForConsideration) sections.issueForConsideration = descData.issueForConsideration;

  const financialKw = ["budget", "expenditure", "cost", "funding", "PKR", "Rs", "million", "salary", "fee", "allocation"];
  const allText = [agendaItem.title, descData.background, descData.issueForConsideration, descData.proposedResolution].filter(Boolean).join(" ").toLowerCase();
  const finMatches = financialKw.filter(kw => allText.includes(kw));
  if (finMatches.length > 0) {
    sections.financialImplications = `[AUTO-DETECTED] Financial implications detected.\nTerms: ${finMatches.join(", ")}\n\n[Treasurer/Finance to provide detailed assessment]`;
  }

  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 24);
  const titleWords = agendaItem.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const pastDecisions = await prisma.agendaItem.findMany({
    where: { id: { not: agendaItem.id }, status: { in: ["DECIDED", "CLOSED"] }, createdAt: { gte: cutoff } },
    include: { decisions: { select: { decisionText: true } }, meetingCalendar: { select: { meetingNumber: true, meetingDate: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  const related = pastDecisions.filter(past => {
    const pw = past.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const ov = titleWords.filter((w: string) => pw.includes(w)).length;
    let pd: any = {}; try { pd = JSON.parse(past.description || "{}"); } catch {}
    return (titleWords.length > 0 && ov / titleWords.length >= 0.25) || (descData.category && pd.category && descData.category === pd.category);
  }).slice(0, 5);
  if (related.length > 0) {
    sections.priorDecisions = related.map(r => {
      const d = r.decisions?.[0];
      return `Meeting #${r.meetingCalendar?.meetingNumber} (${r.meetingCalendar?.meetingDate ? new Date(r.meetingCalendar.meetingDate).toLocaleDateString() : "N/A"}):\n"${r.title}" — ${r.status}` + (d ? `\nDecision: "${d.decisionText}"` : "");
    }).join("\n\n");
  }

  if (descData.proposedResolution) sections.proposedResolution = descData.proposedResolution;
  return sections;
}

function checkSectionCompleteness(content: any): { complete: boolean; percentage: number; missing: string[] } {
  let sections: any = {};
  try { sections = typeof content === "string" ? JSON.parse(content) : content || {}; } catch { sections = {}; }
  const required = TEMPLATE_SECTIONS.filter(s => s.required);
  const missing: string[] = [];
  let filled = 0;
  for (const sec of required) {
    if (sections[sec.key] && String(sections[sec.key]).trim().length > 10) { filled++; } else { missing.push(sec.label); }
  }
  return { complete: missing.length === 0, percentage: Math.round((filled / required.length) * 100), missing };
}

// GET /api/board/working-papers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const paperId = searchParams.get("paperId");
    const status = searchParams.get("status");

    if (paperId) {
      const paper = await prisma.workingPaper.findUnique({
        where: { id: paperId },
        include: {
          agendaItem: { include: { resolutions: true, meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } } } },
          annexures: true, readReceipts: true,
          meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } },
        },
      });
      if (!paper) return NextResponse.json({ error: "Working paper not found" }, { status: 404 });
      return NextResponse.json({ paper, completeness: checkSectionCompleteness(paper.content), templateSections: TEMPLATE_SECTIONS });
    }

    const where: any = {};
    if (meetingId) where.meetingCalendarId = meetingId;
    if (status) where.status = status;

    const papers = await prisma.workingPaper.findMany({
      where, include: {
        agendaItem: { select: { id: true, title: true, itemNumber: true, status: true, proposedBy: true } },
        meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true } },
        annexures: { select: { id: true, fileName: true, fileType: true } },
        _count: { select: { readReceipts: true } },
      }, orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const enrichedPapers = papers.map(p => ({ ...p, completeness: checkSectionCompleteness(p.content) }));

    const approvedWithoutPapers = await prisma.agendaItem.findMany({
      where: { status: "APPROVED_FOR_AGENDA", ...(meetingId ? { meetingCalendarId: meetingId } : {}), workingPapers: { none: {} } },
      include: { meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } } },
      orderBy: { itemNumber: "asc" },
    });

    const meetings = await prisma.meetingCalendar.findMany({
      where: { status: { in: ["AGENDA_APPROVED", "PAPERS_CIRCULATED", "SCHEDULED", "CALL_ISSUED", "SUBMISSIONS_OPEN", "SUBMISSIONS_CLOSED"] } },
      select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true },
      orderBy: { meetingDate: "desc" },
    });

    const stats = {
      total: enrichedPapers.length,
      instantiated: enrichedPapers.filter(p => p.status === "INSTANTIATED").length,
      inAuthoring: enrichedPapers.filter(p => p.status === "IN_AUTHORING").length,
      inReview: enrichedPapers.filter(p => p.status === "IN_REVIEW").length,
      finalized: enrichedPapers.filter(p => p.status === "FINALIZED").length,
      circulated: enrichedPapers.filter(p => p.status === "CIRCULATED").length,
      awaitingInstantiation: approvedWithoutPapers.length,
      avgCompleteness: enrichedPapers.length > 0 ? Math.round(enrichedPapers.reduce((s, p) => s + p.completeness.percentage, 0) / enrichedPapers.length) : 0,
    };

    return NextResponse.json({ papers: enrichedPapers, approvedWithoutPapers, meetings, stats });
  } catch (error) {
    logger.error({ error }, "Failed to fetch working papers");
    return NextResponse.json({ error: "Failed to fetch working papers" }, { status: 500 });
  }
}

// POST /api/board/working-papers — Instantiate from approved agenda item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agendaItemId, authoredBy } = body;
    if (!agendaItemId) return NextResponse.json({ error: "agendaItemId is required" }, { status: 400 });

    const agendaItem = await prisma.agendaItem.findUnique({
      where: { id: agendaItemId },
      include: { resolutions: true, meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } }, workingPapers: { select: { id: true } } },
    });
    if (!agendaItem) return NextResponse.json({ error: "Agenda item not found" }, { status: 404 });
    if (agendaItem.status !== "APPROVED_FOR_AGENDA") return NextResponse.json({ error: `Only APPROVED_FOR_AGENDA items can have working papers. Current: ${agendaItem.status}` }, { status: 400 });
    if (agendaItem.workingPapers.length > 0) return NextResponse.json({ error: "Working paper already exists for this item" }, { status: 409 });

    const sections = await autoPopulateSections(agendaItem);
    const paper = await prisma.workingPaper.create({
      data: { meetingCalendarId: agendaItem.meetingCalendarId, agendaItemId, title: `Working Paper: ${agendaItem.title}`, content: JSON.stringify(sections), status: "INSTANTIATED", authoredBy: authoredBy || "Registrar Office" },
      include: { agendaItem: { select: { id: true, title: true, itemNumber: true } }, meetingCalendar: { select: { id: true, title: true, meetingNumber: true } } },
    });

    await prisma.inAppNotification.create({ data: { recipientRole: "REGISTRAR", title: "Working Paper Instantiated", message: `Working paper for "${agendaItem.title}" created with ${Object.keys(sections).length} auto-populated sections.`, type: "info", meetingCalendarId: agendaItem.meetingCalendarId } });

    logger.info({ paperId: paper.id, agendaItemId, autoPopulated: Object.keys(sections).length }, "Working paper instantiated");
    return NextResponse.json({ paper, completeness: checkSectionCompleteness(sections), autoPopulatedSections: Object.keys(sections), templateSections: TEMPLATE_SECTIONS }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create working paper");
    return NextResponse.json({ error: "Failed to create working paper" }, { status: 500 });
  }
}

// PUT /api/board/working-papers — Edit, submit_review, finalize, return, bulk_instantiate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, sections, reviewedBy, reviewComments, authoredBy } = body;

    if (action === "bulk_instantiate") {
      const { meetingId } = body;
      if (!meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 });
      const items = await prisma.agendaItem.findMany({
        where: { meetingCalendarId: meetingId, status: "APPROVED_FOR_AGENDA", workingPapers: { none: {} } },
        include: { resolutions: true, meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } } },
      });
      const created: any[] = [];
      for (const item of items) {
        const secs = await autoPopulateSections(item);
        const p = await prisma.workingPaper.create({ data: { meetingCalendarId: meetingId, agendaItemId: item.id, title: `Working Paper: ${item.title}`, content: JSON.stringify(secs), status: "INSTANTIATED", authoredBy: authoredBy || "Registrar Office" } });
        created.push(p);
      }
      if (created.length > 0) await prisma.inAppNotification.create({ data: { recipientRole: "REGISTRAR", title: "Working Papers Bulk Created", message: `${created.length} working papers instantiated.`, type: "info", meetingCalendarId: meetingId } });
      return NextResponse.json({ created: created.length, papers: created });
    }

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const paper = await prisma.workingPaper.findUnique({ where: { id }, include: { agendaItem: true, meetingCalendar: true } });
    if (!paper) return NextResponse.json({ error: "Working paper not found" }, { status: 404 });

    if (action === "edit" || !action) {
      if (!["INSTANTIATED", "IN_AUTHORING"].includes(paper.status)) return NextResponse.json({ error: `Cannot edit in ${paper.status}` }, { status: 400 });
      let existing: any = {}; try { existing = JSON.parse(paper.content || "{}"); } catch {}
      const merged = { ...existing, ...sections };
      const updated = await prisma.workingPaper.update({ where: { id }, data: { content: JSON.stringify(merged), status: paper.status === "INSTANTIATED" ? "IN_AUTHORING" : paper.status, ...(authoredBy ? { authoredBy } : {}) } });
      return NextResponse.json({ paper: updated, completeness: checkSectionCompleteness(merged) });
    }

    if (action === "submit_review") {
      if (!["INSTANTIATED", "IN_AUTHORING"].includes(paper.status)) return NextResponse.json({ error: `Cannot submit from ${paper.status}` }, { status: 400 });
      const comp = checkSectionCompleteness(paper.content);
      if (!comp.complete) return NextResponse.json({ error: "Required sections incomplete", completeness: comp }, { status: 422 });
      const updated = await prisma.workingPaper.update({ where: { id }, data: { status: "IN_REVIEW" } });
      await prisma.inAppNotification.create({ data: { recipientRole: "REGISTRAR", title: "Paper Ready for Review", message: `"${paper.title}" submitted for review.`, type: "action", meetingCalendarId: paper.meetingCalendarId } });
      return NextResponse.json({ paper: updated, action: "submitted_for_review" });
    }

    if (action === "finalize") {
      if (paper.status !== "IN_REVIEW") return NextResponse.json({ error: `Cannot finalize from ${paper.status}` }, { status: 400 });
      const updated = await prisma.workingPaper.update({ where: { id }, data: { status: "FINALIZED", reviewedBy: reviewedBy || "Registrar", reviewComments: reviewComments || null } });
      await prisma.inAppNotification.create({ data: { recipientRole: "VICE_CHANCELLOR", title: "Working Paper Finalized", message: `"${paper.title}" finalized and ready for circulation.`, type: "success", meetingCalendarId: paper.meetingCalendarId } });
      return NextResponse.json({ paper: updated, action: "finalized" });
    }

    if (action === "return") {
      if (paper.status !== "IN_REVIEW") return NextResponse.json({ error: `Cannot return from ${paper.status}` }, { status: 400 });
      if (!reviewComments) return NextResponse.json({ error: "reviewComments required" }, { status: 400 });
      const updated = await prisma.workingPaper.update({ where: { id }, data: { status: "IN_AUTHORING", reviewedBy: reviewedBy || null, reviewComments } });
      await prisma.inAppNotification.create({ data: { recipientRole: "REGISTRAR", title: "Paper Returned", message: `"${paper.title}" returned: ${reviewComments}`, type: "warning", meetingCalendarId: paper.meetingCalendarId } });
      return NextResponse.json({ paper: updated, action: "returned" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error({ error }, "Failed to update working paper");
    return NextResponse.json({ error: "Failed to update working paper" }, { status: 500 });
  }
}
