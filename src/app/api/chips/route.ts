// src/app/api/chips/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

type Chip = "NONE" | "WILDCARD" | "BENCH_BOOST" | "TRIPLE_CAPTAIN" | "TWO_CAPTAINS";

async function uid() {
  const jar = await cookies();
  return jar.get("uid")?.value || (await prisma.user.findFirst({ select: { id: true } }))?.id || null;
}

export async function POST(req: Request) {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const chip: Chip = body.chip;

    const allowed: Chip[] = ["NONE", "WILDCARD", "BENCH_BOOST", "TRIPLE_CAPTAIN", "TWO_CAPTAINS"];
    if (!allowed.includes(chip)) {
      return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
    }

    // Check if chip has already been used (except for NONE which clears chip selection)
    if (chip !== "NONE") {
      const existingUsage = await prisma.usedChip.findUnique({
        where: { userId_chip: { userId, chip } },
        include: { gameweek: { select: { name: true } } },
      });
      
      if (existingUsage) {
        return NextResponse.json({ 
          error: `${chip} chip has already been used in ${existingUsage.gameweek.name}` 
        }, { status: 400 });
      }
    }

    // "Active" GW is the one you are editing: the next upcoming, else the most recent
    const now = new Date();
    const nextGw = await prisma.gameweek.findFirst({ where: { deadline: { gt: now } }, orderBy: { deadline: "asc" } });
    const activeGw =
      nextGw ?? (await prisma.gameweek.findFirst({ orderBy: { deadline: "desc" } }));
    if (!activeGw) return NextResponse.json({ error: "No gameweeks" }, { status: 400 });

    // Update the squad for this GW
    const squad = await prisma.userSquad.findUnique({
      where: { userId_gameweekId: { userId, gameweekId: activeGw.id } },
    });
    if (!squad) {
      return NextResponse.json({ error: "No squad for active gameweek" }, { status: 400 });
    }

    const updated = await prisma.userSquad.update({
      where: { id: squad.id },
      data: { chip },
      select: { id: true, chip: true },
    });

    return NextResponse.json({ ok: true, chip: updated.chip });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
