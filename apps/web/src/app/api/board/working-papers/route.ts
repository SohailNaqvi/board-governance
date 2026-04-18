import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agendaItemId = searchParams.get("agendaItemId");
    
    const where = agendaItemId ? { agendaItemId } : {};
    
    const papers = await prisma.workingPaper.findMany({
      where,
      include: { annexures: true, readReceipts: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(papers);
  } catch (error) {
    console.error("Error fetching working papers:", error);
    return NextResponse.json({ error: "Failed to fetch working papers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paper = await prisma.workingPaper.create({
      data: {
        meetingCalendarId: body.meetingCalendarId,
        agendaItemId: body.agendaItemId,
        title: body.title,
        content: body.content || null,
        status: body.status || "INSTANTIATED",
        authoredBy: body.authoredBy || "system",
      },
    });
    return NextResponse.json(paper, { status: 201 });
  } catch (error) {
    console.error("Error creating working paper:", error);
    return NextResponse.json({ error: "Failed to create working paper" }, { status: 500 });
  }
}
