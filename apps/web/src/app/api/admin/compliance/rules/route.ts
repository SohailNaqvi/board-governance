/**
 * GET  /api/admin/compliance/rules     — List rules (optional filters)
 * POST /api/admin/compliance/rules     — Create a new rule
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService, CatalogServiceError } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../lib/logger";

function getService() {
  return new CatalogService(createPrismaRuleStore());
}

async function authorize(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || !hasPermission(session.role, Permissions.ASRB_MANAGE_RULES)) {
    return null;
  }
  return session;
}

// ─── GET: List rules ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const filter: Record<string, string | undefined> = {
      ruleId: url.searchParams.get("ruleId") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      caseType: url.searchParams.get("caseType") ?? undefined,
    };

    const service = getService();
    const rules = await service.listRules(filter as any);

    return NextResponse.json({ rules, count: rules.length });
  } catch (error) {
    logger.error({ error }, "Failed to list compliance rules");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create rule ────────────────────────────────────────

const CreateRuleSchema = z.object({
  ruleId: z.string().min(1),
  source: z.enum(["HEC", "UNIVERSITY", "FACULTY", "PROGRAMME"]),
  sourceReference: z.string().optional(),
  appliesToCaseTypes: z.array(z.string()).min(1),
  appliesToProgrammeTypes: z.array(z.string()).optional(),
  severity: z.enum(["BLOCKING", "WARNING", "INFORMATIONAL"]),
  evaluation: z.record(z.unknown()),
  messageTemplate: z.string().min(1),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateRuleSchema.parse(body);

    const service = getService();
    const rule = await service.createRule({
      ...parsed,
      effectiveFrom: parsed.effectiveFrom ? new Date(parsed.effectiveFrom) : undefined,
      effectiveTo: parsed.effectiveTo ? new Date(parsed.effectiveTo) : undefined,
      editedBy: session.email,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof CatalogServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 }
      );
    }
    logger.error({ error }, "Failed to create compliance rule");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
