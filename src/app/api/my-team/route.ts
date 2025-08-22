// src/app/api/my-team/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function uid() {
  const jar = await cookies();
  return (
    jar.get("uid")?.value ||
    (await prisma.user.findFirst({ select: { id: true } }))?.id ||
    null
  );
}


/** ---------- GET: load players + existing squad for active GW ---------- */
export async function GET() {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        price: true,
        team: { select: { id: true, name: true, shortName: true } },
      },
      orderBy: [{ team: { shortName: "asc" } }, { name: "asc" }],
    });

    const now = new Date();
    const nextGw = await prisma.gameweek.findFirst({
      where: { deadline: { gt: now } },
      orderBy: { deadline: "asc" },
    });
    const activeGw =
      nextGw ?? (await prisma.gameweek.findFirst({ orderBy: { deadline: "desc" } }));

    const squad = activeGw
      ? await prisma.userSquad.findUnique({
          where: { userId_gameweekId: { userId, gameweekId: activeGw.id } },
          include: {
            picks: { select: { playerId: true, isCaptain: true, isVice: true } },
          },
        })
      : null;

    // Opponent map for next GW
    const opp: Record<number, string> = {};
    if (nextGw) {
      const fx = await prisma.fixture.findMany({
        where: { gameweekId: nextGw.id },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeTeam: { select: { shortName: true } },
          awayTeam: { select: { shortName: true } },
        },
      });
      for (const f of fx) {
        opp[f.homeTeamId] = `vs ${f.awayTeam.shortName} (H)`;
        opp[f.awayTeamId] = `@ ${f.homeTeam.shortName} (A)`;
      }
    }

    // 👉 Derive captain/vice from pick flags so the client can restore them
    const capId =
      squad?.picks.find((p) => p.isCaptain)?.playerId ?? null;
    const viceId =
      squad?.picks.find((p) => p.isVice)?.playerId ?? null;

    return NextResponse.json({
      players,
      squad: squad
        ? {
            id: squad.id,
            chip: squad.chip,
            freeTransfers: squad.freeTransfers,
            captainId: capId,     // 👈 now included
            viceId: viceId,       // 👈 now included
            picks: squad.picks.map((p) => ({
              playerId: p.playerId,
              isCaptain: p.isCaptain,
              isVice: p.isVice,
            })),
          }
        : null,
      opponentMap: opp,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}


/** ---------- POST: create initial squad for active GW ---------- */
export async function POST(req: Request) {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body.playerIds)
      ? body.playerIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
      : [];

    const now = new Date();
    const nextGw = await prisma.gameweek.findFirst({
      where: { deadline: { gt: now } },
      orderBy: { deadline: "asc" },
    });
    const activeGw =
      nextGw ?? (await prisma.gameweek.findFirst({ orderBy: { deadline: "desc" } }));
    if (!activeGw) {
      return NextResponse.json({ error: "No gameweeks found" }, { status: 400 });
    }

    // block if already exists
    const existing = await prisma.userSquad.findUnique({
      where: { userId_gameweekId: { userId, gameweekId: activeGw.id } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Squad already exists for this gameweek." },
        { status: 409 }
      );
    }

    if (ids.length !== 15) {
      return NextResponse.json({ error: "You must pick 15 players." }, { status: 400 });
    }

    const players = await prisma.player.findMany({
      where: { id: { in: ids } },
      select: { id: true, position: true, price: true, teamId: true },
    });
    if (players.length !== 15) {
      return NextResponse.json({ error: "One or more players not found." }, { status: 400 });
    }

    // caps/limits
    const caps = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<
      "GK" | "DEF" | "MID" | "FWD",
      number
    >;
    const perTeam = new Map<number, number>();
    let cost = 0;
    const byId = new Map(players.map((p) => [p.id, p]));
    for (const id of ids) {
      const p = byId.get(id)!;
      caps[p.position as "GK" | "DEF" | "MID" | "FWD"] += 1;
      perTeam.set(p.teamId, (perTeam.get(p.teamId) ?? 0) + 1);
      cost += Number(p.price);
    }
    if (caps.GK > 2 || caps.DEF > 5 || caps.MID > 5 || caps.FWD > 3) {
      return NextResponse.json({ error: "Position limits exceeded." }, { status: 400 });
    }
    for (const [, c] of perTeam) {
      if (c > 3) {
        return NextResponse.json({ error: "Max 3 players from a single club." }, { status: 400 });
      }
    }
    if (cost > 100 + 1e-9) {
      return NextResponse.json({ error: "Over budget." }, { status: 400 });
    }

    // Sensible default XI: 1-4-4-2 (then fill)
    const gks: number[] = [];
    const defs: number[] = [];
    const mids: number[] = [];
    const fwds: number[] = [];
    for (const id of ids) {
      const p = byId.get(id)!;
      if (p.position === "GK") gks.push(id);
      else if (p.position === "DEF") defs.push(id);
      else if (p.position === "MID") mids.push(id);
      else fwds.push(id);
    }

    const starters: number[] = [];
    const take = (arr: number[], n: number) => {
      const picked = arr.slice(0, n);
      arr.splice(0, picked.length);
      return picked;
    };

    starters.push(...take(gks, 1));
    starters.push(...take(defs, Math.min(4, defs.length)));
    starters.push(...take(mids, Math.min(4, mids.length)));
    starters.push(...take(fwds, Math.min(2, fwds.length)));

    const pools: number[][] = [defs, mids, fwds, gks];
    for (const pool of pools) {
      if (starters.length >= 11) break;
      starters.push(...take(pool, 11 - starters.length));
    }

    // bench (prefer 1 GK)
    const leftovers = [...gks, ...defs, ...mids, ...fwds];
    const bench: number[] = [];
    const gkIdx = leftovers.findIndex((id) => (byId.get(id)!.position === "GK"));
    if (gkIdx !== -1) bench.push(leftovers.splice(gkIdx, 1)[0]);
    while (bench.length < 4 && leftovers.length) bench.push(leftovers.shift()!);

    const orderedIds = [...starters, ...bench];

    const created = await prisma.userSquad.create({
      data: {
        userId,
        gameweekId: activeGw.id,
        picks: {
          createMany: {
            data: orderedIds.map((pid) => ({
              playerId: pid,
              role: "",           // role isn't relied upon; order matters
              isCaptain: false,
              isVice: false,
            })),
            skipDuplicates: true,
          },
        },
      },
      include: { picks: true },
    });

    return NextResponse.json({ ok: true, squadId: created.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500 });
  }
}

/** ---------- PUT: save lineup (starters/bench order + captain/vice) ---------- */
export async function PUT(req: Request) {
  try {
    const userId = await uid();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const starters: number[] = Array.isArray(body.starters) ? body.starters.map(Number) : [];
    const bench: number[] = Array.isArray(body.bench) ? body.bench.map(Number) : [];
    const captainId: number | null = Number.isFinite(Number(body.captainId)) ? Number(body.captainId) : null;
    const viceId: number | null = Number.isFinite(Number(body.viceId)) ? Number(body.viceId) : null;

    // Basic checks
    if (starters.length !== 11 || bench.length !== 4) {
      return NextResponse.json({ error: "Invalid squad sizes." }, { status: 400 });
    }
    const all = [...starters, ...bench];
    if (new Set(all).size !== 15) {
      return NextResponse.json({ error: "Duplicate players in lineup." }, { status: 400 });
    }
    if (!captainId || !viceId || captainId === viceId) {
      return NextResponse.json({ error: "Invalid captain/vice selection." }, { status: 400 });
    }
    if (!starters.includes(captainId) || !starters.includes(viceId)) {
      return NextResponse.json({ error: "C/VC must be among the 11 starters." }, { status: 400 });
    }

    // Formation checks (>=1 GK, >=3 DEF, >=3 MID, >=1 FWD)
    const posOf = new Map<number, "GK" | "DEF" | "MID" | "FWD">(
      (await prisma.player.findMany({
        where: { id: { in: all } },
        select: { id: true, position: true },
      })).map((p) => [p.id, p.position as "GK" | "DEF" | "MID" | "FWD"])
    );
    const cnt = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    starters.forEach((id) => { cnt[posOf.get(id)!] += 1; });
    if (!(cnt.GK >= 1 && cnt.DEF >= 3 && cnt.MID >= 3 && cnt.FWD >= 1)) {
      return NextResponse.json({ error: "Invalid formation." }, { status: 400 });
    }
    // Bench must contain exactly 1 GK
    const benchGK = bench.filter((id) => posOf.get(id) === "GK").length;
    if (benchGK !== 1) {
      return NextResponse.json({ error: "Bench must include exactly 1 GK." }, { status: 400 });
    }

    // Find active GW squad
    const now = new Date();
    const nextGw = await prisma.gameweek.findFirst({
      where: { deadline: { gt: now } },
      orderBy: { deadline: "asc" },
    });
    const activeGw =
      nextGw ?? (await prisma.gameweek.findFirst({ orderBy: { deadline: "desc" } }));
    if (!activeGw) {
      return NextResponse.json({ error: "No gameweeks found" }, { status: 400 });
    }

    const squad = await prisma.userSquad.findUnique({
      where: { userId_gameweekId: { userId, gameweekId: activeGw.id } },
      select: { id: true },
    });
    if (!squad) {
      return NextResponse.json({ error: "No squad for this gameweek." }, { status: 404 });
    }

    // Overwrite picks in desired order and flags
    await prisma.$transaction(async (tx) => {
      await tx.userPick.deleteMany({ where: { squadId: squad.id } });

      await tx.userPick.createMany({
        data: [...starters, ...bench].map((pid) => ({
          squadId: squad.id,
          playerId: pid,
          role: "", // keep empty string if your schema requires NOT NULL
          isCaptain: pid === captainId,
          isVice: pid === viceId,
        })),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500 });
  }
}