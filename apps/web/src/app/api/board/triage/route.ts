import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

/**
 * Slice 4 — Registrar Triage Queue & DSS Intelligence Scoring
 *
 * Per Section 2.3 of board_governance_spec.docx:
 * "The Registrar's office sees a triage queue with DSS-generated flags:
 *  completeness score, financial implications indicator, legal-flag indicator,
 *  duplicate or related precedent matches."
 *
 * Per Section 5 (DSS Intelligence Engine):
 * - 5.1: Completeness scoring against category-specific checklist
 * - 5.2: Precedent retrieval (similar items in last 24 months)
 * - 5.3: Implication analysis (HR, financial, academic, governance, regulatory)
 * - 5.5: Duplicate and relatedness detection
 */

// ─── Category-Specific Completeness Checklists ───────────────────────────────
const COMPLETENESS_CHECKLISTS: Record<string, { field: string; label: string; weight: number }[]> = {
  academic: [
    { field: "title", label: "Item title", weight: 15 },
    { field: "background", label: "Background narrative", weight: 15 },
    { field: "issueForConsideration", label: "Issue for consideration", weight: 20 },
    { field: "proposedResolution", label: "Proposed resolution", weight: 20 },
    { field: "feederResolutionRef", label: "AC resolution reference", weight: 20 },
    { field: "proposedBy", label: "Proposer identified", weight: 10 },
  ],
  financial: [
    { field: "title", label: "Item title", weight: 15 },
    { field: "background", label: "Background narrative", weight: 15 },
    { field: "issueForConsideration", label: "Issue for consideration", weight: 15 },
    { field: "proposedResolution", label: "Proposed resolution", weight: 15 },
    { field: "feederResolutionRef", label: "F&PC resolution reference", weight: 20 },
    { field: "proposedBy", label: "Proposer identified", weight: 10 },
    { field: "financialImpact", label: "Financial impact statement", weight: 10 },
  ],
  hr: [
    { field: "title", label: "Item title", weight: 15 },
    { field: "background", label: "Background narrative", weight: 15 },
    { field: "issueForConsideration", label: "Issue for consideration", weight: 20 },
    { field: "proposedResolution", label: "Proposed resolution", weight: 20 },
    { field: "feederResolutionRef", label: "ASRB resolution reference", weight: 20 },
    { field: "proposedBy", label: "Proposer identified", weight: 10 },
  ],
  governance: [
    { field: "title", label: "Item title", weight: 20 },
    { field: "background", label: "Background narrative", weight: 20 },
    { field: "issueForConsideration", label: "Issue for consideration", weight: 20 },
    { field: "proposedResolution", label: "Proposed resolution", weight: 20 },
    { field: "proposedBy", label: "Proposer identified", weight: 20 },
  ],
  other: [
    { field: "title", label: "Item title", weight: 25 },
    { field: "background", label: "Background narrative", weight: 25 },
    { field: "issueForConsideration", label: "Issue for consideration", weight: 25 },
    { field: "proposedResolution", label: "Proposed resolution", weight: 25 },
  ],
};

// ─── Implication Keywords ─────────────────────────────────────────────────────
const IMPLICATION_RULES: Record<string, { keywords: string[]; label: string; severity: "high" | "medium" | "low" }> = {
  financial: {
    keywords: ["budget", "expenditure", "cost", "funding", "allocation", "revenue", "fee", "salary", "stipend", "grant", "financial", "fiscal", "procurement", "tender", "contract value", "PKR", "Rs", "million", "billion", "remuneration", "honorarium", "allowance"],
    label: "Financial Implications",
    severity: "high",
  },
  legal: {
    keywords: ["legal", "statute", "ordinance", "regulation", "compliance", "court", "litigation", "tribunal", "appeal", "disciplinary", "contract", "agreement", "MoU", "liability", "indemnity", "lawsuit", "HEC directive", "regulatory"],
    label: "Legal/Regulatory Flag",
    severity: "high",
  },
  hr: {
    keywords: ["appointment", "promotion", "transfer", "termination", "resignation", "recruitment", "hiring", "designation", "tenure", "probation", "leave", "deputation", "service", "pension", "gratuity", "BPS", "faculty position", "vacancy"],
    label: "HR Implications",
    severity: "medium",
  },
  academic: {
    keywords: ["curriculum", "programme", "degree", "semester", "examination", "admission", "enrollment", "syllabus", "credit hour", "research", "thesis", "PhD", "MS", "BS", "accreditation", "QEC", "IQAE", "faculty", "department"],
    label: "Academic Implications",
    severity: "medium",
  },
  governance: {
    keywords: ["policy", "governance", "charter", "bylaw", "statute", "committee", "board", "syndicate", "senate", "authority", "delegation", "amendment", "resolution"],
    label: "Governance Impact",
    severity: "low",
  },
};

/**
 * Compute completeness score for an agenda item
 * Per Section 5.1: scored against category-specific checklist
 */
function computeCompletenessScore(item: any): { score: number; maxScore: number; percentage: number; missing: string[]; details: { field: string; label: string; present: boolean; weight: number }[] } {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

  const category = descData.category || "other";
  const checklist = COMPLETENESS_CHECKLISTS[category] || COMPLETENESS_CHECKLISTS.other;

  let score = 0;
  const maxScore = checklist.reduce((s, c) => s + c.weight, 0);
  const missing: string[] = [];
  const details: any[] = [];

  for (const check of checklist) {
    // Check both top-level item fields and description JSON
    const value = item[check.field] || descData[check.field];
    const present = !!value && String(value).trim().length > 0;
    if (present) {
      score += check.weight;
    } else {
      missing.push(check.label);
    }
    details.push({ field: check.field, label: check.label, present, weight: check.weight });
  }

  return { score, maxScore, percentage: Math.round((score / maxScore) * 100), missing, details };
}

/**
 * Detect implications (financial, legal, HR, academic, governance)
 * Per Section 5.3: rule-based classifier
 */
function detectImplications(item: any): { type: string; label: string; severity: string; matchCount: number; matchedTerms: string[] }[] {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

  const searchText = [
    item.title,
    descData.background,
    descData.issueForConsideration,
    descData.proposedResolution,
    descData.category,
  ].filter(Boolean).join(" ").toLowerCase();

  const flags: any[] = [];
  for (const [type, rule] of Object.entries(IMPLICATION_RULES)) {
    const matched = rule.keywords.filter(kw => searchText.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      flags.push({
        type,
        label: rule.label,
        severity: rule.severity,
        matchCount: matched.length,
        matchedTerms: matched.slice(0, 5),
      });
    }
  }

  // Sort by severity (high first) then by match count
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => (severityOrder[a.severity] - severityOrder[b.severity]) || (b.matchCount - a.matchCount));

  return flags;
}

/**
 * Find duplicate and related precedent items
 * Per Section 5.2 & 5.5: search last 24 months for similar titles/categories
 */
async function findPrecedents(item: any): Promise<{ duplicates: any[]; precedents: any[] }> {
  let descData: any = {};
  try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);

  // Get past items (decided, closed, or any historical)
  const pastItems = await prisma.agendaItem.findMany({
    where: {
      id: { not: item.id },
      createdAt: { gte: cutoff },
    },
    include: {
      meetingCalendar: { select: { meetingNumber: true, meetingDate: true, title: true } },
      decisions: { select: { id: true, decisionText: true, decisionDate: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const titleWords = item.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const duplicates: any[] = [];
  const precedents: any[] = [];

  for (const past of pastItems) {
    let pastDesc: any = {};
    try { pastDesc = JSON.parse(past.description || "{}"); } catch { pastDesc = {}; }

    const pastTitle = past.title.toLowerCase();
    const pastTitleWords = pastTitle.split(/\s+/).filter((w: string) => w.length > 3);

    // Word overlap score
    const overlap = titleWords.filter((w: string) => pastTitleWords.includes(w)).length;
    const overlapRatio = titleWords.length > 0 ? overlap / titleWords.length : 0;

    // Category match bonus
    const categoryMatch = descData.category && pastDesc.category && descData.category === pastDesc.category;

    const similarity = overlapRatio + (categoryMatch ? 0.2 : 0);

    if (similarity >= 0.7) {
      // High similarity = potential duplicate
      duplicates.push({
        id: past.id,
        title: past.title,
        status: past.status,
        category: pastDesc.category || "unknown",
        meeting: past.meetingCalendar,
        similarity: Math.min(Math.round(similarity * 100), 100),
        outcome: past.decisions?.[0]?.decisionText || null,
      });
    } else if (similarity >= 0.3 || categoryMatch) {
      // Moderate similarity = related precedent
      precedents.push({
        id: past.id,
        title: past.title,
        status: past.status,
        category: pastDesc.category || "unknown",
        meeting: past.meetingCalendar,
        similarity: Math.round(similarity * 100),
        outcome: past.decisions?.[0]?.decisionText || null,
      });
    }
  }

  return {
    duplicates: duplicates.sort((a, b) => b.similarity - a.similarity).slice(0, 5),
    precedents: precedents.sort((a, b) => b.similarity - a.similarity).slice(0, 10),
  };
}

/**
 * Build the full DSS intelligence dossier for a single item
 */
async function buildDSSDossier(item: any) {
  const completeness = computeCompletenessScore(item);
  const implications = detectImplications(item);
  const { duplicates, precedents } = await findPrecedents(item);

  const financialFlag = implications.some(i => i.type === "financial");
  const legalFlag = implications.some(i => i.type === "legal");
  const highSeverityCount = implications.filter(i => i.severity === "high").length;

  return {
    completeness,
    implications,
    financialFlag,
    legalFlag,
    duplicates,
    precedents,
    riskLevel: highSeverityCount >= 2 ? "high" : highSeverityCount === 1 ? "medium" : "low",
    duplicateAlert: duplicates.length > 0,
    summary: generateDSSSummary(completeness, implications, duplicates),
  };
}

function generateDSSSummary(completeness: any, implications: any[], duplicates: any[]): string {
  const parts: string[] = [];

  if (completeness.percentage < 60) {
    parts.push(`Incomplete (${completeness.percentage}%) — missing: ${completeness.missing.join(", ")}`);
  } else if (completeness.percentage < 80) {
    parts.push(`Partially complete (${completeness.percentage}%)`);
  }

  const highFlags = implications.filter(i => i.severity === "high");
  if (highFlags.length > 0) {
    parts.push(`Flags: ${highFlags.map(f => f.label).join(", ")}`);
  }

  if (duplicates.length > 0) {
    parts.push(`${duplicates.length} potential duplicate(s) found`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "No issues detected.";
}


// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/board/triage — Registrar Triage Queue
// Returns SUBMITTED items enriched with DSS intelligence dossier
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const includeVetted = searchParams.get("includeVetted") === "true";
    const itemId = searchParams.get("itemId"); // Single item dossier

    // If specific item requested, return full dossier
    if (itemId) {
      const item = await prisma.agendaItem.findUnique({
        where: { id: itemId },
        include: {
          meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true } },
          resolutions: true,
        },
      });
      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      const dossier = await buildDSSDossier(item);
      return NextResponse.json({ item, dossier });
    }

    // Build filter for triage queue
    const statusFilter = includeVetted
      ? { in: ["SUBMITTED", "VETTED", "RETURNED"] as any }
      : { in: ["SUBMITTED"] as any };

    const where: any = { status: statusFilter };
    if (meetingId) where.meetingCalendarId = meetingId;

    const items = await prisma.agendaItem.findMany({
      where,
      orderBy: [{ createdAt: "asc" }],
      include: {
        meetingCalendar: { select: { id: true, title: true, meetingNumber: true, meetingDate: true, status: true } },
        resolutions: true,
      },
    });

    // Enrich each item with DSS intelligence
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const dossier = await buildDSSDossier(item);
        return { ...item, dossier };
      })
    );

    // Get meetings with submitted items for filter dropdown
    const meetingsWithItems = await prisma.meetingCalendar.findMany({
      where: {
        agendaItems: { some: { status: { in: ["SUBMITTED", "VETTED", "RETURNED"] } } },
      },
      select: { id: true, title: true, meetingNumber: true, meetingDate: true },
      orderBy: { meetingDate: "desc" },
    });

    // Queue statistics
    const stats = {
      totalInQueue: enrichedItems.length,
      submitted: enrichedItems.filter(i => i.status === "SUBMITTED").length,
      vetted: enrichedItems.filter(i => i.status === "VETTED").length,
      returned: enrichedItems.filter(i => i.status === "RETURNED").length,
      flaggedFinancial: enrichedItems.filter(i => i.dossier.financialFlag).length,
      flaggedLegal: enrichedItems.filter(i => i.dossier.legalFlag).length,
      duplicateAlerts: enrichedItems.filter(i => i.dossier.duplicateAlert).length,
      avgCompleteness: enrichedItems.length > 0
        ? Math.round(enrichedItems.reduce((s, i) => s + i.dossier.completeness.percentage, 0) / enrichedItems.length)
        : 0,
    };

    return NextResponse.json({ items: enrichedItems, meetings: meetingsWithItems, stats });
  } catch (error) {
    logger.error({ error }, "Failed to fetch triage queue");
    return NextResponse.json({ error: "Failed to fetch triage queue" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/board/triage — Registrar actions: vet, return, route
// Per Section 2.3: "return items to proposer, route to Legal Advisor or
// Treasurer for opinion, or mark VETTED for agenda consideration"
// ═══════════════════════════════════════════════════════════════════════════════
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, notes, routeTo, returnReason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    const item = await prisma.agendaItem.findUnique({
      where: { id },
      include: { meetingCalendar: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    switch (action) {
      case "vet": {
        // Mark as VETTED — ready for VC agenda consideration
        if (item.status !== "SUBMITTED") {
          return NextResponse.json({ error: "Only SUBMITTED items can be vetted" }, { status: 400 });
        }
        const updated = await prisma.agendaItem.update({
          where: { id },
          data: {
            status: "VETTED",
            vetted: true,
            vettedDate: new Date(),
            vetterNotes: notes || null,
          },
        });

        // Notify VC that an item has been vetted
        await prisma.inAppNotification.create({
          data: {
            recipientRole: "VICE_CHANCELLOR",
            title: "Item Vetted for Agenda",
            message: `"${item.title}" has been vetted by Registrar and is ready for agenda consideration.`,
            type: "info",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "vet" }, "Item vetted by Registrar");
        return NextResponse.json({ item: updated, action: "vetted" });
      }

      case "return": {
        // Return to proposer with mandatory reason
        if (!returnReason) {
          return NextResponse.json({ error: "returnReason is required when returning an item" }, { status: 400 });
        }

        // Parse existing description and add return info
        let descData: any = {};
        try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }
        descData.returnReason = returnReason;
        descData.returnedAt = new Date().toISOString();
        descData.returnedBy = "Registrar";

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: {
            status: "DRAFT",
            vetted: false,
            vettedDate: null,
            vetterNotes: notes || null,
            description: JSON.stringify(descData),
          },
        });

        // Notify proposer
        await prisma.inAppNotification.create({
          data: {
            recipientRole: "AUTHORIZED_PROPOSER",
            title: "Submission Returned",
            message: `"${item.title}" has been returned by Registrar. Reason: ${returnReason}`,
            type: "warning",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "return", reason: returnReason }, "Item returned to proposer");
        return NextResponse.json({ item: updated, action: "returned" });
      }

      case "route": {
        // Route to Legal Advisor or Treasurer for opinion
        if (!routeTo || !["legal", "treasurer"].includes(routeTo)) {
          return NextResponse.json({ error: "routeTo must be 'legal' or 'treasurer'" }, { status: 400 });
        }

        let descData: any = {};
        try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

        // Track routing history
        if (!descData.routingHistory) descData.routingHistory = [];
        descData.routingHistory.push({
          routedTo: routeTo,
          routedAt: new Date().toISOString(),
          routedBy: "Registrar",
          notes: notes || null,
          status: "pending",
        });

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: {
            vetterNotes: `Routed to ${routeTo === "legal" ? "Legal Advisor" : "Treasurer"} for opinion. ${notes || ""}`.trim(),
            description: JSON.stringify(descData),
          },
        });

        // Notify the target role
        const recipientRole = routeTo === "legal" ? "TREASURER_LEGAL" : "TREASURER_LEGAL";
        await prisma.inAppNotification.create({
          data: {
            recipientRole,
            title: `Opinion Requested: ${item.title}`,
            message: `Registrar has routed "${item.title}" for your ${routeTo === "legal" ? "legal" : "financial"} opinion. ${notes || ""}`.trim(),
            type: "action",
            meetingCalendarId: item.meetingCalendarId,
          },
        });

        logger.info({ itemId: id, action: "route", routeTo }, "Item routed for opinion");
        return NextResponse.json({ item: updated, action: "routed", routedTo: routeTo });
      }

      case "flag": {
        // Add manual flag/note without changing status
        let descData: any = {};
        try { descData = JSON.parse(item.description || "{}"); } catch { descData = {}; }

        if (!descData.manualFlags) descData.manualFlags = [];
        descData.manualFlags.push({
          note: notes,
          flaggedAt: new Date().toISOString(),
          flaggedBy: "Registrar",
        });

        const updated = await prisma.agendaItem.update({
          where: { id },
          data: { description: JSON.stringify(descData) },
        });

        return NextResponse.json({ item: updated, action: "flagged" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Valid: vet, return, route, flag` }, { status: 400 });
    }
  } catch (error) {
    logger.error({ error }, "Failed to process triage action");
    return NextResponse.json({ error: "Failed to process triage action" }, { status: 500 });
  }
}
