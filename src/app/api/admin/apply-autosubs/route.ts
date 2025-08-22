// src/app/api/admin/apply-autosubs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyAutoSubs } from "@/lib/autoSubs";

// Optional: authorize admin via cookie/session if you want
// For now, we assume trusted local use.

export async function POST(req: Request) {
  try {
    const { gwName = "GW1" } = await req.json().catch(() => ({ gwName: "GW1" }));

    const gw = await prisma.gameweek.findFirst({ where: { name: gwName } });
    if (!gw) return NextResponse.json({ error: `Gameweek ${gwName} not found` }, { status: 400 });

    // Build minutes map for this GW: playerId -> total minutes in GW fixtures
    const fixtures = await prisma.fixture.findMany({
      where: { gameweekId: gw.id },
      select: { id: true },
    });
    const fixtureIds = fixtures.map(f => f.id);
    const stats = await prisma.playerStat.findMany({
      where: { fixtureId: { in: fixtureIds } },
      select: { playerId: true, minutes: true },
    });

    const minutes = new Map<number, number>();
    for (const s of stats) {
      minutes.set(s.playerId, (minutes.get(s.playerId) ?? 0) + s.minutes);
    }

    // Positions map for all players involved (we may query all, small league)
    const allPlayers = await prisma.player.findMany({
      select: { id: true, position: true },
    });
    const positions = new Map<number, "GK" | "DEF" | "MID" | "FWD">(
      allPlayers.map(p => [p.id, p.position as any])
    );

    // Iterate all squads for this GW
    const squads = await prisma.userSquad.findMany({
      where: { gameweekId: gw.id },
      include: { picks: true },
    });

    let updated = 0;

    for (const squad of squads) {
      // Extract current starters/bench in role order
      const s = squad.picks
        .filter(p => p.role?.startsWith("S"))
        .sort((a, b) => (a.role! > b.role! ? 1 : -1))
        .map(p => p.playerId);

      const b = squad.picks
        .filter(p => p.role?.startsWith("B"))
        .sort((a, b) => (a.role! > b.role! ? 1 : -1))
        .map(p => p.playerId);

      // If no roles set yet (e.g., user never visited lineup), default to first 11 + last 4
      let starters = s.length === 11 ? s : squad.picks.slice(0, 11).map(p => p.playerId);
      let bench = b.length === 4 ? b : squad.picks.slice(11, 15).map(p => p.playerId);

      // Find C/VC (if any)
      const captainRow = squad.picks.find(p => p.isCaptain);
      const viceRow = squad.picks.find(p => p.isVice);
      const captainId = captainRow?.playerId ?? starters[0] ?? null;
      const viceId = viceRow?.playerId ?? starters.find(id => id !== captainId) ?? null;

      // Apply auto-subs
      const { starters: ns, bench: nb, captainId: nC, viceId: nV } = applyAutoSubs({
        starters,
        bench,
        positions,
        minutesPlayed: minutes,
        captainId,
        viceId,
      });

      // If no change, skip writes
      const changed =
        JSON.stringify(ns) !== JSON.stringify(starters) ||
        JSON.stringify(nb) !== JSON.stringify(bench) ||
        nC !== captainId ||
        nV !== viceId;

      if (!changed) continue;

      // Persist roles and armbands
      await prisma.$transaction([
        prisma.userPick.deleteMany({ where: { squadId: squad.id } }),
        prisma.userPick.createMany({
          data: [
            ...ns.map((pid, i) => ({
              squadId: squad.id,
              playerId: pid,
              role: `S${i + 1}`,
              isCaptain: pid === nC,
              isVice: pid === nV,
            })),
            ...nb.map((pid, i) => ({
              squadId: squad.id,
              playerId: pid,
              role: `B${i + 1}`,
              isCaptain: pid === nC,
              isVice: pid === nV,
            })),
          ],
        }),
      ]);

      updated++;
    }

    return NextResponse.json({ ok: true, updatedSquads: updated, gameweek: gwName });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Auto-subs failed" }, { status: 500 });
  }
}
