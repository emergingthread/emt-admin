import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/common-types:
 *   get:
 *     tags: [Common Types]
 *     summary: List common types
 *     responses:
 *       200: { description: Common types returned }
 *   post:
 *     tags: [Common Types]
 *     summary: Create a common type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Incident Type }
 *     responses:
 *       201: { description: Common type created }
 *       400: { description: Invalid request }
 *       409: { description: Common type already exists }
 */
export async function GET() {
  return NextResponse.json(await prisma.commonMasterType.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ message: "Name is required" }, { status: 400 });
  try {
    return NextResponse.json(await prisma.commonMasterType.create({ data: { name: name.trim() } }), { status: 201 });
  } catch {
    return NextResponse.json({ message: "A common type with this name already exists" }, { status: 409 });
  }
}