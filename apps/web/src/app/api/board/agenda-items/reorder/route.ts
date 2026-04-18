import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: { id: string; itemNumber: number }[] };
    
    await prisma.$transaction(
      items.map((item) =>
        prisma.agendaItem.update({
          where: { id: item.id },
          data: { itemNumber: item.itemNumber },
        })
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering agenda items:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
