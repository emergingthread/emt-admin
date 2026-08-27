import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/common-masters:
 *   get:
 *     tags: [Common Masters]
 *     summary: List common masters
 *     responses:
 *       200: { description: Common masters returned }
 *   post:
 *     tags: [Common Masters]
 *     summary: Create a common master
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, commonTypeId]
 *             properties:
 *               name: { type: string, example: Ambulance }
 *               commonTypeId: { type: integer, example: 1 }
 *     responses:
 *       201: { description: Common master created }
 *       400: { description: Invalid request }
 *       404: { description: Common type not found }
 */
export async function GET() {
  return NextResponse.json(await prisma.commonMaster.findMany({ include: { commonType: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  const { name, commonTypeId } = (await request.json()) as { name?: string; commonTypeId?: number };
  if (!name?.trim() || !commonTypeId) return NextResponse.json({ message: "Name and commonTypeId are required" }, { status: 400 });
  const commonType = await prisma.commonMasterType.findUnique({ where: { id: Number(commonTypeId) } });
  if (!commonType) return NextResponse.json({ message: "Common type not found" }, { status: 404 });
  return NextResponse.json(await prisma.commonMaster.create({ data: { name: name.trim(), commonTypeId: commonType.id, commonTypeName: commonType.name } }), { status: 201 });
}