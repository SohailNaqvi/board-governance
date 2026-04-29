/**
 * GET /api/dss/asrb/cases — List ASRB cases with optional filters.
 *
 * Query params: status, caseType, urgency, feederBodyType (comma-separated), q (search).
 * Returns: { cases: ASRBCase[], count: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { listCases } from "@/lib/asrb/cases";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const statusParam = url.searchParams.get("status");
    const caseTypeParam = url.searchParams.get("caseType");
    const urgencyParam = url.searchParams.get("urgency");
    const feederBodyTypeParam = url.searchParams.get("feederBodyType");
    const search = url.searchParams.get("q") ?? undefined;

    const cases = await listCases({
      status: statusParam ? statusParam.split(",").filter(Boolean) : undefined,
      caseType: caseTypeParam ? caseTypeParam.split(",").filter(Boolean) : undefined,
      urgency: urgencyParam ? urgencyParam.split(",").filter(Boolean) : undefined,
      feederBodyType: feederBodyTypeParam ? feederBodyTypeParam.split(",").filter(Boolean) : undefined,
      search: search || undefined,
    });

    return NextResponse.json({ cases, count: cases.length });
  } catch (error) {
    console.error("Failed to list ASRB cases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
