import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const meetings = await prisma.meetingCalendar.findMany({
      include: {
        agendaItems: {
          orderBy: { itemNumber: "asc" },
          include: {
            workingPapers: true,
            annexures: true,
            resolutions: true,
          },
        },
      },
      orderBy: { meetingDate: "desc" },
    });
    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const meeting = await prisma.meetingCalendar.create({
      data: {
        meetingNumber: body.meetingNumber,
        meetingDate: new Date(body.meetingDate),
        meetingLocation: body.meetingLocation || null,
      },
    });
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
