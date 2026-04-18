import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import logger from "../../../../lib/logger";

// GET /api/board/notifications — List notifications, optionally filtered by role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (role) where.recipientRole = role;
    if (unreadOnly) where.read = false;

    const notifications = await prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.inAppNotification.count({
      where: { ...where, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    logger.error({ error }, "Failed to fetch notifications");
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT /api/board/notifications — Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAllRead, role } = body;

    if (markAllRead && role) {
      // Mark all notifications for a role as read
      const result = await prisma.inAppNotification.updateMany({
        where: { recipientRole: role, read: false },
        data: { read: true, readAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (id) {
      const updated = await prisma.inAppNotification.update({
        where: { id },
        data: { read: true, readAt: new Date() },
      });
      return NextResponse.json({ notification: updated });
    }

    return NextResponse.json({ error: "Provide id or markAllRead+role" }, { status: 400 });
  } catch (error) {
    logger.error({ error }, "Failed to update notification");
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
