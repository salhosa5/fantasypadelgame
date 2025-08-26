import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalPlayers,
      totalTeams, 
      totalGameweeks,
      activeFixtures,
      completedFixtures,
      totalUsers
    ] = await Promise.all([
      prisma.player.count(),
      prisma.team.count(),
      prisma.gameweek.count(),
      prisma.fixture.count({ where: { status: { in: ["UPCOMING", "LIVE"] } } }),
      prisma.fixture.count({ where: { status: "FINISHED" } }),
      prisma.user.count()
    ]);

    return NextResponse.json({
      totalPlayers,
      totalTeams,
      totalGameweeks,
      activeFixtures,
      completedFixtures,
      totalUsers
    });
  } catch (e: any) {
    console.error("Dashboard stats error:", e);
    return NextResponse.json({ 
      totalPlayers: 0,
      totalTeams: 0,
      totalGameweeks: 0,
      activeFixtures: 0,
      completedFixtures: 0,
      totalUsers: 0
    });
  }
}