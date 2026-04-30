import { NextResponse } from "next/server";
import { getDecisionStats } from "@/lib/decisions";

export async function GET() {
  try {
    const stats = await getDecisionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching decision stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch decision stats" },
      { status: 500 }
    );
  }
}
