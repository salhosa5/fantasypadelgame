// src/app/api/admin/compute-points/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pointsFromStat } from "@/lib/scoring";

/**
 * POST /api/admin/compute-points
 * Body: { gwName?: string }  // defaults to "GW1"
 *
 * Steps:
 * 1) Loads all fixtures in GW and builds a points map per player from PlayerStat.
 * 2) For every UserSquad in that GW:
 *    - Reads starters (S1..S11) and C/VC flags from picks (post-autosubs).
 *    - Sums points for starters; doubles Captain (or VC if C didn't play).
 * 3) Upserts SquadScore for each squad.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const gwName: string = body?.gwName || "GW1";

    const gw = await prisma.gameweek.findFirst({ where: { name: gwName } });
    if (!gw) return NextResponse.json({ error: `Gameweek ${gwName} not found` }, { status: 400 });

    // All fixtures for this GW
    const fixtures = await prisma.fixture.findMany({
      where: { gameweekId: gw.id },
      select: { id: true },
    });
    const fixtureIds = fixtures.map(f => f.id);
    if (fixtureIds.length === 0) {
      return NextResponse.json({ error: "No fixtures in this gameweek." }, { status: 400 });
    }

    // All stats in this GW
    const stats = await prisma.playerStat.findMany({
      where: { fixtureId: { in: fixtureIds } },
      select: {
        playerId: true,
        minutes: true,
        goals: true,
        assists: true,
        cleanSheet: true,
        goalsConceded: true,
        penSaved: true,
        penMissed: true,
        yellowCards: true,
        redCards: true,
        ownGoals: true,
        motm: true,
      },
    });

    // We need player positions to compute points
    const playerIds = [...new Set(stats.map(s => s.playerId))];
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, position: true },
    });
    const pos = new Map(players.map(p => [p.id, p.position as "GK" | "DEF" | "MID" | "FWD"]));

    // Build minutes + points maps
    const minutes = new Map<number, number>();
    const points = new Map<number, number>();
    for (const s of stats) {
      const pPos = pos.get(s.playerId) as any;
      const pts = pointsFromStat(
        {
          minutes: s.minutes,
          goals: s.goals,
          assists: s.assists,
          cleanSheet: s.cleanSheet,
          goalsConceded: s.goalsConceded,
          penSaved: s.penSaved,
          penMissed: s.penMissed,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
          ownGoals: s.ownGoals,
          motm: s.motm,
        } as any,
        { position: pPos } as any
      );
      minutes.set(s.playerId, (minutes.get(s.playerId) ?? 0) + s.minutes);
      points.set(s.playerId, (points.get(s.playerId) ?? 0) + pts);
    }

    // All squads for this GW (post-autosubs picks)
    const squads = await prisma.userSquad.findMany({
      where: { gameweekId: gw.id },
      include: { picks: true },
    });

    let updated = 0;

    for (const squad of squads) {
      const picks = squad.picks;

      // starters, captain, vice from picks (roles already reflect autosubs)
      const starters = picks
        .filter(p => (p.role ?? "").startsWith("S"))
        .sort((a, b) => (a.role! > b.role! ? 1 : -1))
        .map(p => p.playerId);

      const bench = picks
        .filter(p => (p.role ?? "").startsWith("B"))
        .sort((a, b) => (a.role! > b.role! ? 1 : -1))
        .map(p => p.playerId);

      const cap = picks.find(p => p.isCaptain)?.playerId ?? null;
      const vice = picks.find(p => p.isVice)?.playerId ?? null;

      // Sum points for starters
      let total = 0;
      for (const id of starters) total += points.get(id) ?? 0;

      // Double C or, if C didn't play, double VC (FPL behavior)
      if (cap != null) {
        const capPlayed = (minutes.get(cap) ?? 0) > 0 && starters.includes(cap);
        if (capPlayed) {
          total += points.get(cap) ?? 0;
        } else if (vice != null && starters.includes(vice) && (minutes.get(vice) ?? 0) > 0) {
          total += points.get(vice) ?? 0;
        }
      }

      await prisma.squadScore.upsert({
        where: { squadId: squad.id },
        create: { squadId: squad.id, points: total },
        update: { points: total },
      });

      updated++;
    }

    return NextResponse.json({ ok: true, updatedSquads: updated, gameweek: gwName });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Compute failed" }, { status: 500 });
  }
}
