import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jar = await cookies();
  const id = jar.get("uid")?.value;
  if (!id) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, teamName: true },
  });
  return NextResponse.json({ user });
}
