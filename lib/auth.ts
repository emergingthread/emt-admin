import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AuthenticatedUser = { id: number; name: string; email: string; role: string };
type TokenPayload = { userId: number; name: string; email: string; role: string };

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    if (!Number.isInteger(payload.userId)) throw new Error("Invalid token");
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, name: true, email: true, role: true } });
    return user ?? NextResponse.json({ message: "Authentication required" }, { status: 401 });
  } catch {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }
}

export function isAuthResponse(value: AuthenticatedUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
