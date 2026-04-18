import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    const where = entityId ? { entityId } : {};
    
    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching audit events:", error);
    return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await prisma.auditEvent.create({
      data: {
        eventType: body.eventType,
        entityType: body.entityType,
        entityId: body.entityId,
        userId: body.userId,
        changes: JSON.stringify(body.changes),
        payloadHash: body.payloadHash || "",
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating audit event:", error);
    return NextResponse.json({ error: "Failed to create audit event" }, { status: 500 });
  }
}
