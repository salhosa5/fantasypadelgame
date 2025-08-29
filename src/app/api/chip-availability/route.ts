// src/app/api/chip-availability/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function uid() {
  const jar = await cookies();
  return jar.get("uid")?.value || (await prisma.user.findFirst({ select: { id: true } }))?.id || null;
}

export async function GET() {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    // Get all chips that have been used by this user
    const usedChips = await prisma.usedChip.findMany({
      where: { userId },
      select: { chip: true, gameweekId: true, usedAt: true },
    });

    const usedChipTypes = new Set(usedChips.map(uc => uc.chip));

    // Define all available chips
    const allChips = ["WILDCARD", "BENCH_BOOST", "TRIPLE_CAPTAIN", "TWO_CAPTAINS"] as const;
    
    const availableChips = allChips.map(chip => {
      const isUsed = usedChipTypes.has(chip);
      const usedInfo = usedChips.find(uc => uc.chip === chip);
      
      return {
        chip,
        available: !isUsed,
        reason: isUsed 
          ? `Already used in gameweek (GW${usedInfo?.gameweekId})` 
          : undefined,
        usedAt: usedInfo?.usedAt,
        usedInGameweek: usedInfo?.gameweekId,
      };
    });

    return NextResponse.json({
      availableChips,
      totalUsed: usedChips.length,
      remainingChips: allChips.length - usedChips.length,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}