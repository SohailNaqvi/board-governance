import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "../../../../lib/auth/password";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

// In-memory rate limiter: Map of IP -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  // Reset window if expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  // Increment count and check limit
  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitKey = getRateLimitKey(request);

    if (isRateLimited(rateLimitKey)) {
      logger.warn({ ip: rateLimitKey }, "Login rate limit exceeded");
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generic error for security (don't reveal if user exists or password is wrong)
    if (!user || user.deactivatedAt) {
      logger.warn({ email }, "Login attempt with invalid email or deactivated user");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      // User has no password set (shouldn't happen in normal flow)
      logger.warn({ userId: user.id }, "Login attempt for user with no password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      logger.warn({ userId: user.id }, "Login attempt with wrong password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session including mustChangePassword flag
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    const response = NextResponse.json(
      {
        success: true,
        mustChangePassword: user.mustChangePassword,
      },
      { status: 200 }
    );

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
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
