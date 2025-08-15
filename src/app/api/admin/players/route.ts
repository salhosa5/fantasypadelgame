import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.player.findMany({ include: { team: true } });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, teamId, position, price, status } = body || {};
  if (!name || !teamId || !position || price == null || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const p = await prisma.player.create({
    data: {
      name: String(name),
      teamId: Number(teamId),
      position,
      price,
      status,
    },
  });
  return NextResponse.json(p, { status: 201 });
}
