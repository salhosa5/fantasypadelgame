// src/app/api/leagues/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUserId() {
  const jar = await cookies();
  const uid = jar.get("uid")?.value;
  if (uid) return uid;
  const first = await prisma.user.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

function jsonOk(data: any, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}
function jsonErr(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Create a short, unique invite code (e.g., 6 uppercase letters/digits)
async function generateUniqueCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () =>
    Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  for (let i = 0; i < 10; i++) {
    const code = pick();
    const existing = await prisma.league.findUnique({ where: { code } });
    if (!existing) return code;
  }
  // Extremely unlikely fallback
  return `${Date.now()}`.slice(-6);
}

/** GET /api/leagues
 * Returns all leagues the current user belongs to.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonErr("Not logged in", 401);

    const memberships = await prisma.leagueMember.findMany({
      where: { userId },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            code: true,
            adminUserId: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const leagues = memberships.map((m) => ({
      id: m.league.id,
      name: m.league.name,
      code: m.league.code,
      isAdmin: m.league.adminUserId === userId,
    }));

    return jsonOk({ leagues });
  } catch (e: any) {
    console.error("GET /api/leagues error:", e);
    return jsonErr(e?.message || "Failed to load leagues", 500);
  }
}

/** POST /api/leagues  { name }
 * Creates a league and adds current user as admin + member.
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonErr("Not logged in", 401);

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim();
    if (!name) return jsonErr("Name required");

    const code = await generateUniqueCode();

    const league = await prisma.league.create({
      data: {
        name,
        code,
        adminUserId: userId,
        members: {
          create: [{ userId }], // add creator as first member
        },
      },
      select: { id: true, name: true, code: true, adminUserId: true },
    });

    return jsonOk({ ok: true, league });
  } catch (e: any) {
    console.error("POST /api/leagues error:", e);
    return jsonErr(e?.message || "Create failed", 500);
  }
}

/** PUT /api/leagues  { code }
 * Joins an existing league by invite code.
 */
export async function PUT(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonErr("Not logged in", 401);

    const body = await req.json().catch(() => ({}));
    const rawCode = (body?.code ?? "").toString().trim().toUpperCase();
    if (!rawCode) return jsonErr("Code required");

    const league = await prisma.league.findUnique({ where: { code: rawCode } });
    if (!league) return jsonErr("League not found with that code", 404);

    const existing = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId } },
    });
    if (existing) return jsonOk({ ok: true, joined: false, message: "Already a member" });

    await prisma.leagueMember.create({
      data: { leagueId: league.id, userId },
    });

    return jsonOk({ ok: true, joined: true, league: { id: league.id, name: league.name, code: league.code } });
  } catch (e: any) {
    console.error("PUT /api/leagues error:", e);
    return jsonErr(e?.message || "Join failed", 500);
  }
}

/** DELETE /api/leagues?leagueId=...  (or body { leagueId })
 * Leaves a league (admins can also leave; the league remains).
 */
export async function DELETE(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonErr("Not logged in", 401);

    const url = new URL(req.url);
    const fromQuery = url.searchParams.get("leagueId");
    const fromBody = await req
      .json()
      .then((b) => (b?.leagueId ? String(b.leagueId) : null))
      .catch(() => null);
    const leagueId = fromQuery ?? fromBody;
    if (!leagueId) return jsonErr("leagueId required");

    await prisma.leagueMember.delete({
      where: { leagueId_userId: { leagueId, userId } },
    });

    return jsonOk({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/leagues error:", e);
    return jsonErr(e?.message || "Leave failed", 500);
  }
}
