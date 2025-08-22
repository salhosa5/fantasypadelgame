// src/app/api/auth/signin/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

function looksHashed(v: string | null | undefined) {
  return !!v && v.startsWith("$2"); // bcrypt hashes start with $2a/$2b/$2y
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const hash = user.passwordHash ?? "";

    let ok = false;
    if (looksHashed(hash)) {
      ok = await bcrypt.compare(password, hash);
    } else {
      // legacy/plain support — remove once all users are migrated to hashes
      ok = password === hash;
    }

    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // set uid cookie so the rest of the app can identify the user
    const jar = await cookies();
    jar.set("uid", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Signin failed" }, { status: 500 });
  }
}
