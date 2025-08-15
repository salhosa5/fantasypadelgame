import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }          // 👈 awaitable
) {
  try {
    const { id } = await ctx.params;                // 👈 await it
    const body = await req.json();
    const { name, teamId, position, price, status } = body ?? {};

    const data: any = {};
    if (name !== undefined) data.name = String(name);
    if (teamId !== undefined) data.teamId = Number(teamId);
    if (position !== undefined) data.position = position;
    if (price !== undefined) data.price = new Prisma.Decimal(price);
    if (status !== undefined) data.status = status;

    const updated = await prisma.player.update({ where: { id: Number(id) }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/admin/players/[id] failed:", e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }          // 👈 awaitable
) {
  const { id } = await ctx.params;                  // 👈 await it
  await prisma.$transaction(async (tx) => {
    await tx.playerStat.deleteMany({ where: { playerId: Number(id) } });
    await tx.player.delete({ where: { id: Number(id) } });
  });
  return NextResponse.json({ ok: true });
}
