// src/app/api/admin/gws/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const gameweeks = await prisma.gameweek.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ gameweeks });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to load gameweeks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, deadlineISO } = await req.json();
    if (!name || !deadlineISO) return NextResponse.json({ error: "name and deadlineISO required" }, { status: 400 });
    const gw = await prisma.gameweek.create({
      data: { name: String(name), deadline: new Date(deadlineISO) },
    });
    return NextResponse.json({ ok: true, gameweek: gw });
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
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.deadlineISO === "string") patch.deadline = new Date(body.deadlineISO);

    const gw = await prisma.gameweek.update({ where: { id }, data: patch });
    return NextResponse.json({ ok: true, gameweek: gw });
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

    // Optional: prevent delete if fixtures exist
    const count = await prisma.fixture.count({ where: { gameweekId: id } });
    if (count > 0) {
      return NextResponse.json({ error: "Cannot delete: fixtures exist for this GW" }, { status: 400 });
    }

    await prisma.gameweek.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
