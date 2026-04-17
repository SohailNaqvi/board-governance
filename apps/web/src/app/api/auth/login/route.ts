import { NextRequest, NextResponse } from "next/server";
import { createSession, findSeedUserByEmail } from "@/lib/auth";
import logger from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = findSeedUserByEmail(email);
    if (!user) {
      logger.warn({ email }, "Login attempt with unknown email");
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      { success: true, message: "Logged in successfully" },
      { status: 200 }
    );

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    logger.info({ userId: user.id, email }, "User logged in successfully");

    return response;
  } catch (error) {
    logger.error({ error }, "Login error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
