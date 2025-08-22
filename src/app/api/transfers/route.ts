// src/app/api/transfers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

type Pos = "GK" | "DEF" | "MID" | "FWD";

async function getCurrentUserId() {
  const jar = await cookies();
  const uid = jar.get("uid")?.value;
  if (uid) return uid;
  const first = await prisma.user.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body?.playerIds) ? body.playerIds : [];
    const chip: string | null =
      typeof body?.chip === "string" ? body.chip as any : null;

    const playerIds: number[] = raw
      .map((x: any) => Number(typeof x === "object" ? x?.playerId : x))
      .filter((n: any) => Number.isFinite(n));

    if (playerIds.length !== 15) {
      return NextResponse.json({ error: "You must submit exactly 15 players." }, { status: 400 });
    }
    if (new Set(playerIds).size !== 15) {
      return NextResponse.json({ error: "Players must be unique (15 different ids)." }, { status: 400 });
    }

    // Ensure we have an active GW (earliest not in the past by deadline, else latest past)
    const now = new Date();
    let gw =
      (await prisma.gameweek.findFirst({ where: { deadline: { gt: now } }, orderBy: { deadline: "asc" } })) ??
      (await prisma.gameweek.findFirst({ orderBy: { deadline: "desc" } }));

    if (!gw) {
      gw = await prisma.gameweek.create({
        data: { name: "GW1", deadline: new Date(Date.now() + 7 * 864e5) },
      });
    }

    const squad = await prisma.userSquad.findUnique({
      where: { userId_gameweekId: { userId, gameweekId: gw.id } },
      select: { id: true, budget: true, freeTransfers: true, chip: true, picks: true },
    });
    if (!squad) {
      return NextResponse.json({ error: "Squad not found for this user/gameweek." }, { status: 400 });
    }

    // Fetch players for validation
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, position: true, team: { select: { shortName: true } }, price: true },
    });
    if (players.length !== 15) {
      return NextResponse.json({ error: "One or more players not found." }, { status: 400 });
    }

    // Validate: 2/5/5/3 by position, ≤3 per team, total price ≤ 100
    const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
    const MAX_PER_TEAM = 3;
    const BUDGET = 100.0;

    const byPos: Record<Pos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const byTeam = new Map<string, number>();
    let cost = 0;

    for (const p of players) {
      cost += Number(p.price);
      byPos[p.position as Pos] += 1;
      const t = p.team.shortName;
      byTeam.set(t, (byTeam.get(t) ?? 0) + 1);
    }

    for (const k of Object.keys(POS_LIMITS) as (keyof typeof POS_LIMITS)[]) {
      if (byPos[k] !== POS_LIMITS[k]) {
        return NextResponse.json(
          { error: `Invalid ${k} count: ${byPos[k]}/${POS_LIMITS[k]}` },
          { status: 400 }
        );
      }
    }
    for (const [, c] of byTeam) {
      if (c > MAX_PER_TEAM) {
        return NextResponse.json(
          { error: `Too many from one club: ${c}/${MAX_PER_TEAM}` },
          { status: 400 }
        );
      }
    }
    if (cost > BUDGET + 1e-9) {
      return NextResponse.json(
        { error: `Budget exceeded: ${cost.toFixed(1)} / ${BUDGET}` },
        { status: 400 }
      );
    }

    // Determine transfers made by comparing old picks vs new ids
    const oldIds = (squad.picks ?? []).map((p) => p.playerId);
    const oldSet = new Set(oldIds);
    const newSet = new Set(playerIds);
    const outIds = oldIds.filter((id) => !newSet.has(id));
    const inIds = playerIds.filter((id) => !oldSet.has(id));
    const transfersMade = Math.max(outIds.length, inIds.length);

    // Carry free transfers (cap 5): nextFree = clamp(currFree - used + 1, 1, 5)
    const currFree = Number(squad.freeTransfers ?? 1);
    const nextFree = Math.max(1, Math.min(5, currFree - transfersMade + 1));

    await prisma.$transaction(async (tx) => {
      // wipe/recreate picks
      await tx.userPick.deleteMany({ where: { squadId: squad.id } });
      await tx.userPick.createMany({
        data: playerIds.map((pid) => ({
          squadId: squad.id,
          playerId: pid,
          role: "S11", // satisfy schema (non-null)
          isCaptain: false,
          isVice: false,
        })),
      });

      // persist chip if provided (NONE clears)
      if (chip) {
        await tx.userSquad.update({
          where: { id: squad.id },
          data: { chip: chip as any, freeTransfers: nextFree },
        });
      } else {
        await tx.userSquad.update({
          where: { id: squad.id },
          data: { freeTransfers: nextFree },
        });
      }

      // log transfers for hits
      for (let i = 0; i < Math.max(outIds.length, inIds.length); i++) {
        await tx.transfer.create({
          data: {
            userId,
            gameweekId: gw!.id,
            outPlayerId: outIds[i] ?? outIds[outIds.length - 1] ?? playerIds[0],
            inPlayerId: inIds[i] ?? inIds[inIds.length - 1] ?? playerIds[0],
            priceDiff: null,
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      transfers: transfersMade,
      projectedHit: Math.max(0, transfersMade - currFree) * 4,
      freeTransfers: nextFree,
      chip: chip ?? squad.chip ?? "NONE",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Transfers save failed" },
      { status: 500 }
    );
  }
}
