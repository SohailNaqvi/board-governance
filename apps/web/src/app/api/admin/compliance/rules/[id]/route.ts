/**
 * GET    /api/admin/compliance/rules/[id]  — Get single rule
 * PATCH  /api/admin/compliance/rules/[id]  — Update draft rule
 * DELETE /api/admin/compliance/rules/[id]  — Retire rule
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "../../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService, CatalogServiceError } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../../lib/logger";

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

// ─── GET: Single rule ─────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = getService();
    const rule = await service.getRule(params.id);
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    logger.error({ error }, "Failed to get compliance rule");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH: Update draft ──────────────────────────────────────

const UpdateRuleSchema = z.object({
  sourceReference: z.string().optional(),
  appliesToCaseTypes: z.array(z.string()).min(1).optional(),
  appliesToProgrammeTypes: z.array(z.string()).optional(),
  severity: z.enum(["BLOCKING", "WARNING", "INFORMATIONAL"]).optional(),
  evaluation: z.record(z.unknown()).optional(),
  messageTemplate: z.string().min(1).optional(),
  effectiveFrom: z.string().datetime().nullable().optional(),
  effectiveTo: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateRuleSchema.parse(body);

    const service = getService();
    const rule = await service.updateDraft(params.id, {
      ...parsed,
      effectiveFrom: parsed.effectiveFrom ? new Date(parsed.effectiveFrom) : undefined,
      effectiveTo: parsed.effectiveTo ? new Date(parsed.effectiveTo) : undefined,
      editedBy: session.email,
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof CatalogServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }
    logger.error({ error }, "Failed to update compliance rule");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Retire rule ──────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = getService();
    const rule = await service.retire(params.id, session.email);

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof CatalogServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }
    logger.error({ error }, "Failed to retire compliance rule");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
