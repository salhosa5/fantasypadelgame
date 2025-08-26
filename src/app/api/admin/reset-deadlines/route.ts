import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Reset all gameweek deadlines to their original weekly schedule
    const gameweeks = await prisma.gameweek.findMany({
      orderBy: { id: "asc" }
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start next week
    
    for (let i = 0; i < gameweeks.length; i++) {
      const gw = gameweeks[i];
      const deadline = new Date(startDate);
      deadline.setDate(deadline.getDate() + i * 7); // Weekly intervals
      deadline.setHours(18, 30, 0, 0); // 6:30 PM deadline
      
      await prisma.gameweek.update({
        where: { id: gw.id },
        data: { deadline }
      });
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Reset ${gameweeks.length} gameweek deadlines to original schedule`
    });
  } catch (e: any) {
    console.error('Reset deadlines error:', e);
    return NextResponse.json({ 
      error: e?.message || "Failed to reset deadlines"
    }, { status: 500 });
  }
}