import { NextResponse } from "next/server";

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
 *               email: { type: string, format: email, example: admin@emt.local }
 *               password: { type: string, format: password, example: password }
 *     responses:
 *       200: { description: Login succeeded }
 *       401: { description: Invalid credentials }
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (body.email !== "admin@emt.local" || body.password !== "password") {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
  return NextResponse.json({ user: { name: "Alex Morgan", role: "Administrator" } });
}