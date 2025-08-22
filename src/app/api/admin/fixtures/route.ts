// src/app/api/admin/fixtures/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [teams, gameweeks, fixtures] = await Promise.all([
      prisma.team.findMany({ orderBy: { shortName: "asc" } }),
      prisma.gameweek.findMany({ orderBy: { id: "asc" } }),
      prisma.fixture.findMany({
        orderBy: [{ gameweekId: "asc" }, { kickoff: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      }),
    ]);

    return NextResponse.json({
      teams,
      gameweeks,
      fixtures,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to load fixtures" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { gameweekId, homeTeamId, awayTeamId, kickoffISO } = await req.json();
    if (!gameweekId || !homeTeamId || !awayTeamId) {
      return NextResponse.json({ error: "gameweekId, homeTeamId, awayTeamId are required" }, { status: 400 });
    }
    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: "Home and Away must be different teams" }, { status: 400 });
    }

    const gw = await prisma.gameweek.findUnique({ where: { id: Number(gameweekId) } });
    if (!gw) return NextResponse.json({ error: "Gameweek not found" }, { status: 400 });

    const home = await prisma.team.findUnique({ where: { id: Number(homeTeamId) } });
    const away = await prisma.team.findUnique({ where: { id: Number(awayTeamId) } });
    if (!home || !away) return NextResponse.json({ error: "Team not found" }, { status: 400 });

    const kickoff = kickoffISO ? new Date(kickoffISO) : new Date(gw.deadline.getTime() + 2*3600*1000);

    const fx = await prisma.fixture.create({
      data: {
        gameweekId: gw.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        kickoff,
        status: "UPCOMING",
        scored: false,
      },
      include: { homeTeam: true, awayTeam: true },
    });

    return NextResponse.json({ ok: true, fixture: fx });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const patch: any = {};
    if (body.gameweekId) {
      const gw = await prisma.gameweek.findUnique({ where: { id: Number(body.gameweekId) } });
      if (!gw) return NextResponse.json({ error: "Gameweek not found" }, { status: 400 });
      patch.gameweekId = gw.id;
    }
    if (body.kickoffISO) {
      patch.kickoff = new Date(body.kickoffISO);
    }

    const fx = await prisma.fixture.update({
      where: { id },
      data: patch,
      include: { homeTeam: true, awayTeam: true },
    });

    return NextResponse.json({ ok: true, fixture: fx });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Clean associated stats first
    await prisma.$transaction([
      prisma.playerStat.deleteMany({ where: { fixtureId: id } }),
      prisma.fixture.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
