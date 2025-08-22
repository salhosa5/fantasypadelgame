import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/match?fixtureId=123 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fixtureId = Number(searchParams.get('fixtureId'));
    if (!fixtureId) {
      return NextResponse.json(
        { error: 'fixtureId required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
        playerStats: true,
      },
    });

    if (!fixture) {
      return NextResponse.json(
        { error: 'fixture not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const statByPlayer = new Map(fixture.playerStats.map(s => [s.playerId, s]));
    const mapPlayer = (p: any) => {
      const s = statByPlayer.get(p.id);
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        minutes: s?.minutes ?? 0,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
        cleanSheet: s?.cleanSheet ?? false,
        goalsConceded: s?.goalsConceded ?? 0,
        penSaved: s?.penSaved ?? 0,
        penMissed: s?.penMissed ?? 0,
        yellowCards: s?.yellowCards ?? 0,
        redCards: s?.redCards ?? 0,
        ownGoals: s?.ownGoals ?? 0,
        motm: s?.motm ?? false,
      };
    };

    return NextResponse.json(
      {
        fixture: {
          id: fixture.id,
          home: fixture.homeTeam.name,
          away: fixture.awayTeam.name,
        },
        home: fixture.homeTeam.players.map(mapPlayer),
        away: fixture.awayTeam.players.map(mapPlayer),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('GET /api/admin/match failed', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

/** POST /api/admin/match  { fixtureId, homePlayers[], awayPlayers[] } */
export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : null;

    const { fixtureId, homePlayers, awayPlayers } = (body || {}) as {
      fixtureId: number; homePlayers: any[]; awayPlayers: any[];
    };

    if (!fixtureId) {
      return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
    }

    // Normalize rows
    const rows = [...(homePlayers ?? []), ...(awayPlayers ?? [])].map(r => ({
      ...r,
      id: Number(r.id),
      minutes: Number(r.minutes ?? 0),
      goals: Number(r.goals ?? 0),
      assists: Number(r.assists ?? 0),
      goalsConceded: Number(r.goalsConceded ?? 0),
      penSaved: Number(r.penSaved ?? 0),
      penMissed: Number(r.penMissed ?? 0),
      yellowCards: Number(r.yellowCards ?? 0),
      redCards: Number(r.redCards ?? 0),
      ownGoals: Number(r.ownGoals ?? 0),
      cleanSheet: Boolean(r.cleanSheet),
      motm: Boolean(r.motm),
    }));

    const isZeroRow = (r: any) =>
      r.minutes === 0 && r.goals === 0 && r.assists === 0 && !r.cleanSheet &&
      r.goalsConceded === 0 && r.penSaved === 0 && r.penMissed === 0 &&
      r.yellowCards === 0 && r.redCards === 0 && r.ownGoals === 0 && !r.motm;

    // Build a flat array of ops and run a single non-interactive transaction
    const ops: any[] = [];

    // Ensure we only operate on players that still exist
    const ids = rows.map(r => r.id).filter((x: any) => Number.isFinite(x));
    const existing = await prisma.player.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const existingSet = new Set(existing.map(p => p.id));

    for (const r of rows) {
      if (!Number.isFinite(r.id)) continue;

      // Always clear previous stat row first
      ops.push(prisma.playerStat.deleteMany({ where: { fixtureId, playerId: r.id } }));

      // If player no longer exists or row is "all zeros", skip create
      if (!existingSet.has(r.id) || isZeroRow(r)) continue;

      const data = {
        fixtureId,
        playerId: r.id,
        minutes: r.minutes,
        goals: r.goals,
        assists: r.assists,
        cleanSheet: r.cleanSheet,
        goalsConceded: r.goalsConceded,
        penSaved: r.penSaved,
        penMissed: r.penMissed,
        yellowCards: r.yellowCards,
        redCards: r.redCards,
        ownGoals: r.ownGoals,
        motm: r.motm,
      };

      ops.push(prisma.playerStat.create({ data }));
    }

    // Also update the fixture status
    ops.push(prisma.fixture.update({
      where: { id: fixtureId },
      data: { status: 'FINISHED', scored: true },
    }));

    await prisma.$transaction(ops);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('POST /api/admin/match failed', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
