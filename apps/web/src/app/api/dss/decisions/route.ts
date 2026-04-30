import { NextRequest, NextResponse } from "next/server";
import { listDecisions } from "@/lib/decisions";
import { GovernanceBodyType, DecisionCategory, DecisionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const sourceBodyTypeStr = searchParams.get("sourceBodyType");
    const statusStr = searchParams.get("status");
    const categoryStr = searchParams.get("category");
    const search = searchParams.get("q");

    const sourceBodyType = sourceBodyTypeStr
      ? (sourceBodyTypeStr.split(",") as GovernanceBodyType[])
      : undefined;

    const status = statusStr ? (statusStr.split(",") as DecisionStatus[]) : undefined;

    const category = categoryStr
      ? (categoryStr.split(",") as DecisionCategory[])
      : undefined;

    const decisions = await listDecisions({
      sourceBodyType,
      status,
      category,
      search: search || undefined,
    });

    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}
