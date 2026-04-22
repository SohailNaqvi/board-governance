/**
 * GET /api/admin/compliance/attributes — List attribute catalog entries
 *
 * Optional query param: ?source=student to filter by source
 * Used by the predicate builder UI for auto-complete.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../../lib/auth/session";
import { hasPermission, Permissions } from "@ums/domain";
import {
  getAttributeEntries,
  getAttributeEntriesBySource,
  type AttributeEntry,
} from "@ums/compliance";
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
    const source = url.searchParams.get("source") as AttributeEntry["source"] | null;

    const entries = source
      ? getAttributeEntriesBySource(source)
      : getAttributeEntries();

    return NextResponse.json({ attributes: entries, count: entries.length });
  } catch (error) {
    logger.error({ error }, "Failed to list attribute catalog");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
