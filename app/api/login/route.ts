import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createUserToken } from "@/lib/jwt";

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate an administrator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Login succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: JWT access token }
 *                 user: { type: object }
 *       401: { description: Invalid credentials }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ message: "DATABASE_URL is not configured on the server" }, { status: 503 });
    if (!process.env.JWT_SECRET) return NextResponse.json({ message: "JWT_SECRET is not configured on the server" }, { status: 503 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }
    const token = createUserToken({ userId: user.id, name: user.name, email: user.email, role: user.role });
    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login failed:", error);
    const code = (error as { code?: string })?.code;
    if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "P1001", "P2021"].includes(code || "")) {
      return NextResponse.json({ message: "Unable to connect to the production database" }, { status: 503 });
    }
    return NextResponse.json({ message: "Unable to sign in. Check the deployment server logs." }, { status: 500 });
  }
}