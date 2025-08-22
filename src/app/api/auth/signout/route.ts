import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  // Clear cookie globally
  jar.set("uid", "", { value: "", expires: new Date(0), path: "/" });
  return NextResponse.json({ ok: true });
}
