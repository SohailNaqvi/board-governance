import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, createSession } from "../../../../lib/auth/session";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../../../../lib/auth/password";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.passwordHash) {
      logger.error({ userId: session.userId }, "User not found or has no password hash");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      logger.warn({ userId: session.userId }, "Change password failed: invalid current password");
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    // Issue a new session with mustChangePassword=false so middleware allows access
    const newToken = await createSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      mustChangePassword: false,
    });

    logger.info({ userId: session.userId }, "User changed password successfully");

    const response = NextResponse.json(
      { success: true, message: "Password changed successfully" },
      { status: 200 }
    );

    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error({ error }, "Change password error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
