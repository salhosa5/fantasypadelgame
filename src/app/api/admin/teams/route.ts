import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: { players: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ teams });
  } catch (e: any) {
    console.error("GET /api/admin/teams error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, shortName } = await req.json();
    
    if (!name?.trim() || !shortName?.trim()) {
      return NextResponse.json({ error: "Name and short name are required" }, { status: 400 });
    }

    // Check for duplicate names or short names
    const existing = await prisma.team.findFirst({
      where: {
        OR: [
          { name: name.trim() },
          { shortName: shortName.trim().toUpperCase() }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: existing.name === name.trim() 
          ? "A team with this name already exists" 
          : "A team with this short name already exists" 
      }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase()
      },
      include: {
        _count: {
          select: { players: true }
        }
      }
    });

    return NextResponse.json({ ok: true, team });
  } catch (e: any) {
    console.error("POST /api/admin/teams error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create team" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, shortName } = await req.json();
    
    if (!id || !name?.trim() || !shortName?.trim()) {
      return NextResponse.json({ error: "ID, name and short name are required" }, { status: 400 });
    }

    // Check for duplicate names or short names (excluding current team)
    const existing = await prisma.team.findFirst({
      where: {
        AND: [
          { id: { not: Number(id) } },
          {
            OR: [
              { name: name.trim() },
              { shortName: shortName.trim().toUpperCase() }
            ]
          }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: existing.name === name.trim() 
          ? "A team with this name already exists" 
          : "A team with this short name already exists" 
      }, { status: 400 });
    }

    const team = await prisma.team.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase()
      },
      include: {
        _count: {
          select: { players: true }
        }
      }
    });

    return NextResponse.json({ ok: true, team });
  } catch (e: any) {
    console.error("PUT /api/admin/teams error:", e);
    return NextResponse.json({ error: e?.message || "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Delete team and all associated players (cascade)
    await prisma.$transaction([
      prisma.player.deleteMany({ where: { teamId: Number(id) } }),
      prisma.team.delete({ where: { id: Number(id) } })
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/teams error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete team" }, { status: 500 });
  }
}