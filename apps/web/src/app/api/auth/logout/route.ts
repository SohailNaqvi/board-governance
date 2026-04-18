import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    response.cookies.delete("session");

    logger.info({}, "User logged out");

    response.headers.set("Location", "/login");

    return response;
  } catch (error) {
    logger.error({ error }, "Logout error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
