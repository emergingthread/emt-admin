import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"]);

function isConnectionError(error: unknown) {
  return connectionErrorCodes.has((error as { code?: string })?.code ?? "");
}

const getBody = async (request: Request) => (await request.json()) as {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
};

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (isConnectionError(error)) {
      return NextResponse.json({ message: "Database connection failed. Please check the database server and DATABASE_URL." }, { status: 503 });
    }

    return NextResponse.json({ message: "Unable to load user" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const body = await getBody(request);
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim() || undefined;

  if (!name && !email && !body.password && !role) {
    return NextResponse.json({ message: "At least one field is required" }, { status: 400 });
  }

  if (body.password && body.password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const existing = email ? await prisma.user.findFirst({ where: { email, NOT: { id } } }) : null;
    if (existing) {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(role ? { role } : {}),
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    if (isConnectionError(error)) {
      return NextResponse.json({ message: "Database connection failed. Please check the database server and DATABASE_URL." }, { status: 503 });
    }

    return NextResponse.json({ message: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (isConnectionError(error)) {
      return NextResponse.json({ message: "Database connection failed. Please check the database server and DATABASE_URL." }, { status: 503 });
    }

    return NextResponse.json({ message: "Unable to delete user" }, { status: 500 });
  }
}
