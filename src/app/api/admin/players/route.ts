// src/app/api/admin/players/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [teams, players] = await Promise.all([
      prisma.team.findMany({ orderBy: { shortName: "asc" } }),
      prisma.player.findMany({
        orderBy: [{ teamId: "asc" }, { position: "asc" }, { price: "desc" }],
        include: { team: true },
      }),
    ]);
    // Prisma Decimal -> toString for price field
    const mapped = players.map(p => ({ ...p, price: p.price.toString() }));
    return NextResponse.json({ teams, players: mapped });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to load players" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, teamId, position, price, status } = await req.json();
    if (!name || !teamId || !position) {
      return NextResponse.json({ error: "name, teamId, position required" }, { status: 400 });
    }
    if (!["GK","DEF","MID","FWD"].includes(position)) {
      return NextResponse.json({ error: "bad position" }, { status: 400 });
    }
    const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
    if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 });

    const created = await prisma.player.create({
      data: {
        name: String(name),
        teamId: Number(teamId),
        position,
        price: Number(price ?? 0) || 4.0,
        status: status ?? "FIT",
      },
      include: { team: true },
    });

    return NextResponse.json({ ok: true, player: { ...created, price: created.price.toString() } });
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
    if (body.teamId) {
      const t = await prisma.team.findUnique({ where: { id: Number(body.teamId) } });
      if (!t) return NextResponse.json({ error: "team not found" }, { status: 400 });
      patch.teamId = t.id;
    }
    if (body.position) {
      if (!["GK","DEF","MID","FWD"].includes(body.position)) {
        return NextResponse.json({ error: "bad position" }, { status: 400 });
      }
      patch.position = body.position;
    }
    if (typeof body.price === "number") {
      patch.price = Number(body.price);
    }
    if (body.status) {
      if (!["FIT","INJURED","SUSPENDED"].includes(body.status)) {
        return NextResponse.json({ error: "bad status" }, { status: 400 });
      }
      patch.status = body.status;
    }

    const updated = await prisma.player.update({
      where: { id },
      data: patch,
      include: { team: true },
    });
    return NextResponse.json({ ok: true, player: { ...updated, price: updated.price.toString() } });
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

    // Delete dependent rows to avoid FK issues
    await prisma.$transaction([
      prisma.userPick.deleteMany({ where: { playerId: id } }),
      prisma.playerStat.deleteMany({ where: { playerId: id } }),
      prisma.player.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
