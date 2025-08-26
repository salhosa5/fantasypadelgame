import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get current active gameweek
    const now = new Date();
    const activeGw = await prisma.gameweek.findFirst({
      where: { deadline: { gt: now } },
      orderBy: { deadline: "asc" }
    }) ?? await prisma.gameweek.findFirst({ 
      orderBy: { deadline: "desc" } 
    });

    if (!activeGw) {
      return NextResponse.json({ 
        leaderboard: [], 
        currentGameweek: "No GW" 
      });
    }

    // Get all users with their total points
    const users = await prisma.user.findMany({
      include: {
        points: {
          select: {
            gwPoints: true,
            totalPoints: true,
            gameweekId: true,
            gameweek: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate leaderboard
    const leaderboard = users.map(user => {
      // Use the most recent totalPoints from user points, or calculate from gwPoints
      const latestUserPoints = user.points.sort((a, b) => b.gameweekId - a.gameweekId)[0];
      const totalPoints = latestUserPoints?.totalPoints || user.points.reduce((sum, up) => sum + up.gwPoints, 0);
      
      // Get points from current gameweek
      const currentGwPoints = user.points.find(up => up.gameweekId === activeGw.id);
      const gameweekPoints = currentGwPoints?.gwPoints || 0;

      return {
        rank: 0, // Will be set after sorting
        userId: user.id,
        email: user.email,
        totalPoints,
        gameweekPoints,
        teamName: user.teamName
      };
    })
    .filter(entry => entry.totalPoints > 0) // Only show users with points
    .sort((a, b) => b.totalPoints - a.totalPoints) // Sort by total points descending
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({
      leaderboard,
      currentGameweek: activeGw.name
    });
  } catch (e: any) {
    console.error('Leaderboard API Error:', e);
    return NextResponse.json({ 
      error: e?.message || "Failed to load leaderboard",
      leaderboard: [],
      currentGameweek: "Error"
    }, { status: 500 });
  }
}