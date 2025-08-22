// src/app/api/leagues/[code]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const normalized = code.toUpperCase();

  const league = await prisma.league.findUnique({ where: { code: normalized } });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  // "Current" GW = most recent with deadline <= now; if none, earliest
  const now = new Date();
  let currentGw =
    (await prisma.gameweek.findFirst({
      where: { deadline: { lte: now } },
      orderBy: { deadline: "desc" },
    })) ??
    (await prisma.gameweek.findFirst({ orderBy: { deadline: "asc" } }));

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: league.id },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);

  if (userIds.length === 0) {
    return NextResponse.json({
      league: { id: league.id, name: league.name, code: league.code },
      currentGameweek: currentGw ? { id: currentGw.id, name: currentGw.name } : null,
      standings: [],
    });
  }

  const squads = await prisma.userSquad.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, gameweekId: true },
  });

  const allSquadIds = squads.map((s) => s.id);
  const currentSquadIds = currentGw
    ? squads.filter((s) => s.gameweekId === currentGw!.id).map((s) => s.id)
    : [];

  // All historic points (may or may not include current depending on your scorer)
  const scoresAll = await prisma.squadScore.findMany({
    where: { squadId: { in: allSquadIds } },
    select: { squadId: true, points: true },
  });

  // Current GW points (used for GW column and to ensure totals include current)
  const scoresCurrent = currentSquadIds.length
    ? await prisma.squadScore.findMany({
        where: { squadId: { in: currentSquadIds } },
        select: { squadId: true, points: true },
      })
    : [];

  const ptsBySquadAll = new Map(scoresAll.map((s) => [s.squadId, s.points]));
  const ptsBySquadCurrent = new Map(scoresCurrent.map((s) => [s.squadId, s.points]));

  const totalByUser = new Map<string, number>();
  const gwByUser = new Map<string, number>();

  for (const s of squads) {
    // Historic total
    totalByUser.set(
      s.userId,
      (totalByUser.get(s.userId) ?? 0) + (ptsBySquadAll.get(s.id) ?? 0)
    );
    // Current GW
    if (currentGw && s.gameweekId === currentGw.id) {
      gwByUser.set(
        s.userId,
        (gwByUser.get(s.userId) ?? 0) + (ptsBySquadCurrent.get(s.id) ?? 0)
      );
    }
  }

  // Names
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, teamName: true, email: true },
  });
  const nameOf = (uid: string) => {
    const u = users.find((x) => x.id === uid);
    return u?.teamName || u?.email || uid;
  };

  // 🚩 Make sure "Total" includes current GW (without double counting if your scorer already wrote it)
  const standings = userIds
    .map((uid) => {
      const base = totalByUser.get(uid) ?? 0;
      const gw = gwByUser.get(uid) ?? 0;
      const totalPoints = base + (ptsBySquadCurrent.size ? gw : 0);
      return {
        userId: uid,
        name: nameOf(uid),
        gwPoints: gw,
        totalPoints,
      };
    })
    .sort((a, b) =>
      b.totalPoints !== a.totalPoints
        ? b.totalPoints - a.totalPoints
        : b.gwPoints - a.gwPoints
    );

  return NextResponse.json({
    league: { id: league.id, name: league.name, code: league.code },
    currentGameweek: currentGw ? { id: currentGw.id, name: currentGw.name } : null,
    standings,
  });
}
