import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/auth";
import logger from "../../../lib/logger";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    logger.error({ error }, "Get current user error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
