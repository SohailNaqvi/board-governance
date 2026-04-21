/**
 * POST /api/admin/compliance/rules/[id]/publish — Publish a DRAFT rule
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService, CatalogServiceError } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../../../lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session || !hasPermission(session.role, Permissions.ASRB_MANAGE_RULES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new CatalogService(createPrismaRuleStore());
    const rule = await service.publish(params.id, session.email);

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof CatalogServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }
    logger.error({ error }, "Failed to publish compliance rule");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
