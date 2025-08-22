// src/app/api/players/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params is a Promise; we must await it
) {
  try {
    const { id } = await ctx.params;        // 👈 await params
    const pid = Number(id);
    if (!Number.isFinite(pid)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Base player + team
    const player = await prisma.player.findUnique({
      where: { id: pid },
      select: {
        id: true,
        name: true,
        position: true,
        price: true,
        teamId: true,
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Recent stats (last 5 appearances) with fixture info if available
    const recent = await prisma.playerStat.findMany({
      where: { playerId: pid },
      orderBy: { fixtureId: "desc" },
      take: 5,
      select: {
        fixtureId: true,
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
        fixture: {
          select: {
            id: true,
            gameweekId: true,
            homeTeam: { select: { shortName: true } },
            awayTeam: { select: { shortName: true } },
          },
        },
      },
    });

    // Next 5 fixtures for this player's team (simple, by upcoming fixture id)
    const lastPlayedFixtureId = recent[0]?.fixtureId ?? 0;
    const upcoming = await prisma.fixture.findMany({
      where: {
        OR: [{ homeTeamId: player.teamId }, { awayTeamId: player.teamId }],
        id: { gt: lastPlayedFixtureId },
      },
      orderBy: { id: "asc" },
      take: 5,
      select: {
        id: true,
        gameweekId: true,
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
      },
    });

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        price: Number(player.price),
        team: player.team,
      },
      recent,
      upcoming,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load player profile" },
      { status: 500 }
    );
  }
}
