import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    
    const where = meetingId ? { meetingCalendarId: meetingId } : {};
    
    const items = await prisma.agendaItem.findMany({
      where,
      include: {
        workingPapers: true,
        annexures: true,
        resolutions: true,
      },
      orderBy: { itemNumber: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching agenda items:", error);
    return NextResponse.json({ error: "Failed to fetch agenda items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.agendaItem.create({
      data: {
        meetingCalendarId: body.meetingCalendarId,
        itemNumber: body.itemNumber,
        title: body.title,
        description: body.description || null,
        status: body.status || "DRAFT",
        proposedBy: body.proposedBy || "system",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating agenda item:", error);
    return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const item = await prisma.agendaItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating agenda item:", error);
    return NextResponse.json({ error: "Failed to update agenda item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    await prisma.agendaItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agenda item:", error);
    return NextResponse.json({ error: "Failed to delete agenda item" }, { status: 500 });
  }
}
