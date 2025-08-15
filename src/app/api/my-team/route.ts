// src/app/api/my-team/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUserId() {
  // Next 15+: cookies() must be awaited
  const jar = await cookies();
  const uid = jar.get("uid")?.value;
  if (uid) return uid;

  // DEV FALLBACK so pages work locally without auth wired
  const first = await prisma.user.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Ensure GW1 exists
  let gw = await prisma.gameweek.findFirst({ where: { name: "GW1" } });
  if (!gw) {
    gw = await prisma.gameweek.create({
      data: {
        name: "GW1",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Ensure a squad row for this user+GW
  let squad = await prisma.userSquad.findUnique({
    where: { userId_gameweekId: { userId, gameweekId: gw.id } },
    include: { picks: true },
  });
  if (!squad) {
    squad = await prisma.userSquad.create({
      data: { userId, gameweekId: gw.id, budget: 100 },
      include: { picks: true },
    });
  }

  // Players list (for pickers & lineup labels)
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: [{ team: { name: "asc" } }, { position: "asc" }, { price: "desc" }],
  });

  // Helper: sort picks by role S1..S11 then B1..B4; null/unknown roles go last
  const roleRank = (role: string | null) => {
    if (!role) return 10_000;
    const m = role.match(/^([SB])(\d{1,2})$/);
    if (!m) return 9_000;
    const bucket = m[1] === "S" ? 0 : 100; // starters first
    return bucket + Number(m[2]);
  };

  // Order picks if roles exist; else the DB order (createMany order) is used
  const orderedPicks = squad.picks
    .slice()
    .sort((a, b) => roleRank(a.role) - roleRank(b.role))
    .map((p) => p.playerId);

  const captainId = squad.picks.find((p) => p.isCaptain)?.playerId ?? null;
  const viceId = squad.picks.find((p) => p.isVice)?.playerId ?? null;

  return NextResponse.json({
    gameweek: { id: gw.id, name: gw.name, deadline: gw.deadline, locked: false }, // wire 'locked' later
    // expose ids (ordered) + C/VC so the client doesn't default to first two
    squad: { id: squad.id, picks: orderedPicks, captainId, viceId },
    players,
  });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawIds = Array.isArray(body?.playerIds) ? body.playerIds : [];
  const playerIds: number[] = rawIds
    .map((x: any) => Number(typeof x === "object" ? x?.playerId : x))
    .filter((n: any) => Number.isFinite(n));

  if (playerIds.length !== 15) {
    return NextResponse.json({ error: "You must submit exactly 15 players." }, { status: 400 });
  }

  // fetch only what we need
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, position: true, teamId: true, price: true },
  });
  if (players.length !== 15) {
    return NextResponse.json({ error: "One or more players not found." }, { status: 400 });
  }

  // ---- Validation ----
  const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
  const MAX_PER_TEAM = 3;
  const BUDGET = 100.0;

  const byPos: Record<keyof typeof POS_LIMITS, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const byTeam = new Map<number, number>();
  let cost = 0;

  for (const p of players) {
    cost += Number(p.price);
    // @ts-ignore
    byPos[p.position] += 1;
    byTeam.set(p.teamId, (byTeam.get(p.teamId) ?? 0) + 1);
  }

  for (const k of Object.keys(POS_LIMITS) as (keyof typeof POS_LIMITS)[]) {
    if (byPos[k] !== POS_LIMITS[k]) {
      return NextResponse.json(
        { error: `Invalid ${k} count: ${byPos[k]}/${POS_LIMITS[k]}` },
        { status: 400 }
      );
    }
  }
  for (const [, c] of byTeam) {
    if (c > MAX_PER_TEAM) {
      return NextResponse.json(
        { error: `Too many from one club: ${c}/${MAX_PER_TEAM}` },
        { status: 400 }
      );
    }
  }
  if (cost > BUDGET + 1e-9) {
    return NextResponse.json(
      { error: `Budget exceeded: ${cost.toFixed(1)} / ${BUDGET}` },
      { status: 400 }
    );
  }
  // --------------------

  const gw = await prisma.gameweek.findFirst({ where: { name: "GW1" } });
  if (!gw) return NextResponse.json({ error: "GW1 missing." }, { status: 400 });

  const squad = await prisma.userSquad.findUnique({
    where: { userId_gameweekId: { userId, gameweekId: gw.id } },
    select: { id: true },
  });
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 400 });

  // Wipe & create fresh picks (no roles yet; lineup page/PUT will assign S/B & C/VC)
  await prisma.$transaction([
    prisma.userPick.deleteMany({ where: { squadId: squad.id } }),
    prisma.userPick.createMany({
      data: playerIds.map((pid) => ({
        squadId: squad.id,
        playerId: pid,
        role: null,
        isCaptain: false,
        isVice: false,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { starters, bench, captainId, viceId } = await req.json();

  if (!Array.isArray(starters) || starters.length !== 11) {
    return NextResponse.json({ error: "Need exactly 11 starters" }, { status: 400 });
  }
  if (!Array.isArray(bench) || bench.length !== 4) {
    return NextResponse.json({ error: "Bench must have 4 players" }, { status: 400 });
  }
  if (captainId === viceId) {
    return NextResponse.json({ error: "Captain and Vice must be different" }, { status: 400 });
  }

  const all = [...starters, ...bench];
  if (new Set(all).size !== 15) {
    return NextResponse.json(
      { error: "Starters + Bench must be 15 unique players" },
      { status: 400 }
    );
  }

  const gw = await prisma.gameweek.findFirst({ where: { name: "GW1" } });
  if (!gw) return NextResponse.json({ error: "GW1 missing" }, { status: 400 });

  const squad = await prisma.userSquad.findUnique({
    where: { userId_gameweekId: { userId, gameweekId: gw.id } },
    include: { picks: true },
  });
  if (!squad) return NextResponse.json({ error: "User squad missing" }, { status: 400 });

  // Validate positions: starters ≥1 GK, ≥3 DEF, ≥3 MID, ≥2 FWD; bench exactly 1 GK
  const players = await prisma.player.findMany({
    where: { id: { in: all } },
    select: { id: true, position: true },
  });
  const pos = new Map(players.map((p) => [p.id, p.position]));

  const count = (ids: number[], want: "GK" | "DEF" | "MID" | "FWD") =>
    ids.reduce((s, id) => (pos.get(id) === want ? s + 1 : s), 0);

  if (
    count(starters, "GK") < 1 ||
    count(starters, "DEF") < 3 ||
    count(starters, "MID") < 3 ||
    count(starters, "FWD") < 2
  ) {
    return NextResponse.json(
      { error: "Formation invalid: need ≥1 GK, ≥3 DEF, ≥3 MID, ≥2 FWD in starters" },
      { status: 400 }
    );
  }
  if (count(bench, "GK") !== 1) {
    return NextResponse.json(
      { error: "Bench must include exactly 1 GK" },
      { status: 400 }
    );
  }
  if (!starters.includes(captainId) || !starters.includes(viceId)) {
    return NextResponse.json(
      { error: "C and VC must be among starters" },
      { status: 400 }
    );
  }

  // Persist roles and C/VC flags
  const data = [
    ...starters.map((pid: number, i: number) => ({
      squadId: squad.id,
      playerId: pid,
      role: `S${i + 1}`,
      isCaptain: pid === captainId,
      isVice: pid === viceId,
    })),
    ...bench.map((pid: number, i: number) => ({
      squadId: squad.id,
      playerId: pid,
      role: `B${i + 1}`,
      isCaptain: pid === captainId,
      isVice: pid === viceId,
    })),
  ];

  await prisma.$transaction([
    prisma.userPick.deleteMany({ where: { squadId: squad.id } }),
    prisma.userPick.createMany({ data }),
  ]);

  return NextResponse.json({ ok: true });
}
