import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('Active GW API - Starting...');
    
    // Get current active gameweek (next deadline or most recent)
    const now = new Date();
    console.log('Active GW API - Current time:', now);
    
    const nextGw = await prisma.gameweek.findFirst({
      where: { deadline: { gt: now } },
      orderBy: { deadline: "asc" },
    });
    console.log('Active GW API - Next gameweek:', nextGw);
    
    const activeGw = nextGw ?? (await prisma.gameweek.findFirst({ 
      orderBy: { deadline: "desc" } 
    }));
    console.log('Active GW API - Active gameweek:', activeGw);

    // First try to get gameweeks without counts to isolate the issue
    const basicGameweeks = await prisma.gameweek.findMany({
      orderBy: { deadline: "asc" },
      select: {
        id: true,
        name: true,
        deadline: true
      }
    });
    console.log('Active GW API - Basic gameweeks count:', basicGameweeks.length);

    // Now try to get counts separately
    let allGameweeks;
    try {
      allGameweeks = await prisma.gameweek.findMany({
        orderBy: { deadline: "asc" },
        include: {
          _count: {
            select: {
              fixtures: true
            }
          }
        }
      });
      console.log('Active GW API - Gameweeks with counts:', allGameweeks.length);
    } catch (countError) {
      console.error('Active GW API - Count query failed:', countError);
      // Fallback to basic gameweeks with manual counts set to 0
      allGameweeks = basicGameweeks.map(gw => ({
        ...gw,
        _count: { fixtures: 0 }
      }));
    }

    return NextResponse.json({ 
      activeGameweek: activeGw,
      gameweeks: allGameweeks 
    });
  } catch (e: any) {
    console.error('Active GW GET API Error:', e);
    return NextResponse.json({ 
      error: e?.message || "Failed to load active gameweek data",
      details: e?.toString(),
      stack: e?.stack
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { action, gameweekId } = await req.json();
    
    if (action === "SET_ACTIVE") {
      // This doesn't actually change the database logic, but we can simulate it
      // by manually setting a future/past deadline for testing purposes
      const targetGw = await prisma.gameweek.findUnique({
        where: { id: Number(gameweekId) }
      });
      
      if (!targetGw) {
        return NextResponse.json({ error: "Gameweek not found" }, { status: 404 });
      }

      // For testing purposes, we'll adjust the deadline to make it "active"
      const now = new Date();
      const newDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // First reset all other gameweeks to future dates
      await prisma.gameweek.updateMany({
        data: { deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } // 30 days in future
      });
      
      // Then set the target gameweek as active
      await prisma.gameweek.update({
        where: { id: targetGw.id },
        data: { deadline: newDeadline }
      });

      return NextResponse.json({ 
        ok: true, 
        message: `Gameweek ${targetGw.name} is now active (deadline set 24h from now)` 
      });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}