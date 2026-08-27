import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"]);

function isConnectionError(error: unknown) {
  return connectionErrorCodes.has((error as { code?: string })?.code ?? "");
}

export function normalizeUserInput(body: { name?: string; email?: string; password?: string; role?: string }) {
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const role = body.role?.trim() || "Administrator";

  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8) {
    throw new Error("A valid name, email, and password of at least 8 characters are required");
  }

  return { name, email, password, role };
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     responses:
 *       200: { description: Users returned }
 *   post:
 *     tags: [Users]
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jordan Lee }
 *               email: { type: string, format: email, example: jordan@example.com }
 *               password: { type: string, format: password, minLength: 8 }
 *               role: { type: string, example: Administrator }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Name or email is invalid }
 *       409: { description: Email already exists }
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"].includes(error.code)) {
      return NextResponse.json({ message: "Database connection failed. Please check the database server and DATABASE_URL." }, { status: 503 });
    }

    return NextResponse.json({ message: "Unable to load users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string; role?: string };
    const { name, email, password, role } = normalizeUserInput(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, email, role, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("valid name, email, and password")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    if (isConnectionError(error)) {
      return NextResponse.json({ message: "Database connection failed. Please check the database server and DATABASE_URL." }, { status: 503 });
    }

    return NextResponse.json({ message: "Unable to create user" }, { status: 500 });
  }
}
