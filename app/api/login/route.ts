import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (body.email !== "admin@emt.local" || body.password !== "password") {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
  return NextResponse.json({ user: { name: "Alex Morgan", role: "Administrator" } });
}