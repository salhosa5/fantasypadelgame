// src/app/api/my-team/live/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { applyAutoSubs } from "@/lib/autoSubs";
import { pointsFromStat } from "@/lib/scoring";

async function uid() {
  const jar = await cookies();
  return jar.get("uid")?.value || (await prisma.user.findFirst({ select: { id: true } }))?.id || null;
}

export async function GET() {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const now = new Date();
    const currentGw =
      (await prisma.gameweek.findFirst({ where: { deadline: { lte: now } }, orderBy: { deadline: "desc" } })) ??
      (await prisma.gameweek.findFirst({ orderBy: { deadline: "asc" } }));

    if (!currentGw) return NextResponse.json({ error: "No gameweek" }, { status: 400 });

    const squad = await prisma.userSquad.findUnique({
      where: { userId_gameweekId: { userId, gameweekId: currentGw.id } },
      include: { picks: true },
    });
    if (!squad) return NextResponse.json({ error: "No squad for current GW" }, { status: 404 });

    const fixtures = await prisma.fixture.findMany({
      where: { gameweekId: currentGw.id },
      select: { id: true },
    });
    const stats = await prisma.playerStat.findMany({
      where: { fixtureId: { in: fixtures.map(f => f.id) } },
    });

    const minutes = new Map<number, number>();
    const acc: Record<number, any> = {};
    for (const s of stats) {
      minutes.set(s.playerId, (minutes.get(s.playerId) ?? 0) + s.minutes);
      const prev = acc[s.playerId] ?? { minutes: 0, goals: 0, assists: 0, cleanSheet: false, goalsConceded: 0, penSaved: 0, penMissed: 0, yellowCards: 0, redCards: 0, ownGoals: 0, motm: false };
      acc[s.playerId] = {
        minutes: prev.minutes + s.minutes,
        goals: prev.goals + s.goals,
        assists: prev.assists + s.assists,
        cleanSheet: prev.cleanSheet || s.cleanSheet,
        goalsConceded: prev.goalsConceded + s.goalsConceded,
        penSaved: prev.penSaved + s.penSaved,
        penMissed: prev.penMissed + s.penMissed,
        yellowCards: prev.yellowCards + s.yellowCards,
        redCards: prev.redCards + s.redCards,
        ownGoals: prev.ownGoals + s.ownGoals,
        motm: prev.motm || s.motm,
      };
    }

    const allPlayers = await prisma.player.findMany({ select: { id: true, name: true, position: true, team: { select: { shortName: true } } } });
    const pos = new Map(allPlayers.map(p => [p.id, p.position]));
    const nameOf = new Map(allPlayers.map(p => [p.id, p.name]));
    const teamOf = new Map(allPlayers.map(p => [p.id, p.team.shortName]));

    const starters0 = squad.picks.slice(0, 11).map(p => p.playerId);
    const bench0    = squad.picks.slice(11).map(p => p.playerId);
    const cap = squad.picks.find(p => p.isCaptain)?.playerId ?? starters0[0] ?? null;
    const vic = squad.picks.find(p => p.isVice)?.playerId ?? starters0.find(id => id !== cap) ?? null;

    const calc = (id: number) => {
      const raw = acc[id];
      if (!raw) return 0;
      return pointsFromStat(raw, { position: pos.get(id) as any });
    };

    let starters = starters0, bench = bench0, captainId = cap, viceId = vic;
    if (squad.chip !== "BENCH_BOOST") {
      const { starters: ns, bench: nb, captainId: nC, viceId: nV } = applyAutoSubs({
        starters: starters0,
        bench: bench0,
        positions: pos as any,
        minutesPlayed: minutes,
        captainId: cap,
        viceId: vic,
      });
      starters = ns; bench = nb; captainId = nC; viceId = nV;
    }

    let total = 0;
    const rows = starters.map(id => {
      const pts = calc(id);
      total += pts;
      return { id, name: nameOf.get(id), team: teamOf.get(id), points: pts, starter: true };
    });
    const benchRows = bench.map(id => ({ id, name: nameOf.get(id), team: teamOf.get(id), points: calc(id), starter: false }));

    // chip & captain math
    const capPlayed = captainId != null && (minutes.get(captainId) ?? 0) > 0 && starters.includes(captainId!);
    const vicPlayed = viceId    != null && (minutes.get(viceId) ?? 0) > 0 && starters.includes(viceId!);

    if (squad.chip === "TRIPLE_CAPTAIN") {
      if (capPlayed) total += 2 * calc(captainId!);
    } else if (squad.chip === "TWO_CAPTAINS") {
      if (capPlayed) total += calc(captainId!);
      if (vicPlayed) total += calc(viceId!);
    } else {
      if (capPlayed) total += calc(captainId!);
    }
    if (squad.chip === "BENCH_BOOST") {
      for (const b of bench) total += calc(b);
    }

    return NextResponse.json({
      gameweek: currentGw.name,
      chip: squad.chip,
      captainId, viceId,
      starters: rows,
      bench: benchRows,
      total,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
