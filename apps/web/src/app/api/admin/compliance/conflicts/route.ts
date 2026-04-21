/**
 * GET /api/admin/compliance/conflicts — Detect rule conflicts
 *
 * Optional query param: ?ruleId=HEC_SOME_RULE to include a specific rule's draft
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session || !hasPermission(session.role, Permissions.ASRB_MANAGE_RULES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const ruleId = url.searchParams.get("ruleId") ?? undefined;

    const service = new CatalogService(createPrismaRuleStore());
    const conflicts = await service.detectConflicts(ruleId);

    return NextResponse.json({ conflicts, count: conflicts.length });
  } catch (error) {
    logger.error({ error }, "Failed to detect conflicts");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
