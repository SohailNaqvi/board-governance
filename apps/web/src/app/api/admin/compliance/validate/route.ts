/**
 * POST /api/admin/compliance/validate — Dry-run validate a predicate expression
 *
 * No persistence; used by the predicate builder UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session || !hasPermission(session.role, Permissions.ASRB_MANAGE_RULES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a predicate expression object" },
        { status: 400 }
      );
    }

    const service = new CatalogService(createPrismaRuleStore());
    const result = service.dryRunValidate(body);

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to validate predicate");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
