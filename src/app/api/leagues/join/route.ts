// src/app/api/leagues/join/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserId() {
  const jar = await cookies();
  const uid = jar.get("uid")?.value;
  if (uid) return uid;
  const first = await prisma.user.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const league = await prisma.league.findUnique({ where: { code: String(code).toUpperCase() } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  await prisma.leagueMember.upsert({
    where: { leagueId_userId: { leagueId: league.id, userId } },
    create: { leagueId: league.id, userId },
    update: {},
  });

  return NextResponse.json({ ok: true, id: league.id, name: league.name, code: league.code });
}
