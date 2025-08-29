// src/app/api/admin/score-gw/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyAutoSubs } from "@/lib/autoSubs";
import { pointsFromStat } from "@/lib/scoring";

export async function POST(req: Request) {
  try {
    const { gwName = "GW1" } = await req.json().catch(() => ({ gwName: "GW1" }));
    const gw = await prisma.gameweek.findFirst({ where: { name: gwName } });
    if (!gw) return NextResponse.json({ error: `Gameweek ${gwName} not found` }, { status: 400 });

    const fixtures = await prisma.fixture.findMany({ where: { gameweekId: gw.id }, select: { id: true } });
    const fixtureIds = fixtures.map(f => f.id);
    const stats = await prisma.playerStat.findMany({ where: { fixtureId: { in: fixtureIds } } });

    const minutes = new Map<number, number>();
    const statMap = new Map<number, any>();
    for (const s of stats) {
      minutes.set(s.playerId, (minutes.get(s.playerId) ?? 0) + s.minutes);
      const prev = statMap.get(s.playerId) ?? {
        minutes: 0, goals: 0, assists: 0, cleanSheet: false,
        goalsConceded: 0, penSaved: 0, penMissed: 0,
        yellowCards: 0, redCards: 0, ownGoals: 0, motm: false,
      };
      statMap.set(s.playerId, {
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
      });
    }

    const allPlayers = await prisma.player.findMany({ select: { id: true, position: true } });
    const positions = new Map<number, "GK" | "DEF" | "MID" | "FWD">(allPlayers.map(p => [p.id, p.position as any]));

    const squads = await prisma.userSquad.findMany({
      where: { gameweekId: gw.id },
      include: { picks: true },
      orderBy: { id: "asc" },
    });

    const pPoints = (playerId: number) => {
      const s = statMap.get(playerId);
      if (!s) return 0;
      const pos = positions.get(playerId) as any;
      return pointsFromStat(s as any, { position: pos } as any);
    };

    const transfersByUser = new Map<string, number>();
    const transferRows = await prisma.transfer.findMany({
      where: { gameweekId: gw.id },
      select: { userId: true },
    });
    for (const t of transferRows) {
      transfersByUser.set(t.userId, (transfersByUser.get(t.userId) ?? 0) + 1);
    }

    for (const squad of squads) {
      const ids = squad.picks.map(p => p.playerId);
      const starters0 = ids.slice(0, 11);
      const bench0    = ids.slice(11, 15);

      const cap = squad.picks.find(p => p.isCaptain)?.playerId ?? starters0[0] ?? null;
      const vic = squad.picks.find(p => p.isVice)?.playerId ?? starters0.find(id => id !== cap) ?? null;

      let starters = starters0, bench = bench0, captainId = cap, viceId = vic;
      if (squad.chip !== "BENCH_BOOST") {
        const { starters: ns, bench: nb, captainId: nC, viceId: nV } = applyAutoSubs({
          starters: starters0,
          bench: bench0,
          positions,
          minutesPlayed: minutes,
          captainId: cap,
          viceId: vic,
        });
        starters = ns; bench = nb; captainId = nC; viceId = nV;
      }

      let total = 0;
      for (const id of starters) total += pPoints(id);
      if (squad.chip === "BENCH_BOOST") for (const id of bench) total += pPoints(id);

      const capPlayed = captainId != null && (minutes.get(captainId) ?? 0) > 0 && starters.includes(captainId);
      const vicPlayed = viceId    != null && (minutes.get(viceId) ?? 0) > 0 && starters.includes(viceId);

      if (squad.chip === "TRIPLE_CAPTAIN") {
        if (capPlayed) total += 2 * pPoints(captainId!);
      } else if (squad.chip === "TWO_CAPTAINS") {
        if (capPlayed) total += pPoints(captainId!);
        if (vicPlayed) total += pPoints(viceId!);
      } else {
        if (capPlayed) total += pPoints(captainId!);
      }

      const made = transfersByUser.get(squad.userId) ?? 0;
      const free = squad.freeTransfers ?? 1;
      
      // Don't deduct points if Wildcard was used this gameweek
      if (squad.chip !== "WILDCARD") {
        total -= Math.max(0, made - free) * 4;
      }

      await prisma.squadScore.upsert({
        where: { squadId: squad.id },
        update: { points: total },
        create: { squadId: squad.id, points: total },
      });

      await prisma.$transaction(async (tx) => {
        await tx.userPoints.upsert({
          where: { userId_gameweekId: { userId: squad.userId, gameweekId: gw.id } },
          update: { gwPoints: total },
          create: { userId: squad.userId, gameweekId: gw.id, gwPoints: total, totalPoints: 0 },
        });
        const sum = await tx.userPoints.aggregate({
          where: { userId: squad.userId },
          _sum: { gwPoints: true },
        });
        await tx.userPoints.update({
          where: { userId_gameweekId: { userId: squad.userId, gameweekId: gw.id } },
          data: { totalPoints: Number(sum._sum.gwPoints ?? 0) },
        });

        // Mark chip as consumed if it was used this gameweek (except NONE)
        if (squad.chip && squad.chip !== "NONE") {
          await tx.usedChip.upsert({
            where: { userId_chip: { userId: squad.userId, chip: squad.chip } },
            update: {}, // Already exists, no update needed
            create: {
              userId: squad.userId,
              chip: squad.chip,
              gameweekId: gw.id,
            },
          });
        }
      });
    }

    // snapshot standings
    let updatedStandings = 0;
    const leagues = await prisma.league.findMany({ select: { id: true } });
    for (const lg of leagues) {
      const members = await prisma.leagueMember.findMany({ where: { leagueId: lg.id }, select: { userId: true } });
      for (const m of members) {
        const up = await prisma.userPoints.findUnique({ where: { userId_gameweekId: { userId: m.userId, gameweekId: gw.id } } });
        if (!up) continue;
        await prisma.leagueStanding.upsert({
          where: { leagueId_gameweekId_userId: { leagueId: lg.id, gameweekId: gw.id, userId: m.userId } },
          update: { gwPoints: up.gwPoints, totalPoints: up.totalPoints },
          create: { leagueId: lg.id, gameweekId: gw.id, userId: m.userId, gwPoints: up.gwPoints, totalPoints: up.totalPoints },
        });
        updatedStandings++;
      }
    }

    return NextResponse.json({
      ok: true,
      gameweek: gwName,
      updatedSquads: squads.length,
      updatedStandings,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Scoring failed" }, { status: 500 });
  }
}
