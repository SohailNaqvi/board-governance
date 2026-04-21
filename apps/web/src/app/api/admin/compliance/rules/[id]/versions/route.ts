/**
 * GET  /api/admin/compliance/rules/[id]/versions — List all versions of a rule
 * POST /api/admin/compliance/rules/[id]/versions — Create a new version (from EFFECTIVE)
 *
 * Note: [id] here is the stable ruleId (e.g. HEC_PHD_SUPERVISOR_QUALIFICATION),
 * not the database record id.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import { CatalogService, CatalogServiceError } from "@ums/compliance";
import { createPrismaRuleStore } from "../../../../../../../lib/asrb/prisma-rule-store";
import logger from "../../../../../../../lib/logger";

async function authorize(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || !hasPermission(session.role, Permissions.ASRB_MANAGE_RULES)) {
    return null;
  }
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new CatalogService(createPrismaRuleStore());
    const versions = await service.getRuleVersions(params.id);

    return NextResponse.json({ ruleId: params.id, versions, count: versions.length });
  } catch (error) {
    logger.error({ error }, "Failed to list rule versions");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authorize(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new CatalogService(createPrismaRuleStore());
    const draft = await service.createNewVersion(params.id, session.email);

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }
    logger.error({ error }, "Failed to create new rule version");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
