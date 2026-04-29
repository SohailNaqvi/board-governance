import { NextRequest, NextResponse } from "next/server";
import { listActions, getActionCount, getActionStats } from "@/lib/board/actions";

/**
 * GET /api/dss/board/actions
 *
 * Query params:
 *   - status: comma-separated status values (e.g., "OPEN,IN_PROGRESS")
 *   - category: comma-separated categories (e.g., "GOVERNANCE,STRATEGIC")
 *   - q: search query (searches description and actionRef)
 *
 * Returns: { actions, count, stats }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const searchQuery = searchParams.get("q");

    const filters = {
      status: statusParam ? statusParam.split(",").filter(Boolean) : undefined,
      category: categoryParam
        ? categoryParam.split(",").filter(Boolean)
        : undefined,
      search: searchQuery || undefined,
    };

    // Fetch data
    const actions = await listActions(filters);
    const count = await getActionCount();
    const stats = await getActionStats();

    return NextResponse.json({
      actions,
      count,
      stats,
    });
  } catch (error) {
    console.error("[api/dss/board/actions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch board actions" },
      { status: 500 }
    );
  }
}
