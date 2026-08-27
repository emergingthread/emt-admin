import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/common-masters/{id}:
 *   patch:
 *     tags: [Common Masters]
 *     summary: Update a common master
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, commonTypeId]
 *             properties:
 *               name: { type: string }
 *               commonTypeId: { type: integer }
 *     responses:
 *       200: { description: Common master updated }
 *       400: { description: Invalid request }
 *       404: { description: Common type not found }
 *   delete:
 *     tags: [Common Masters]
 *     summary: Delete a common master
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Common master deleted }
 *       409: { description: Common master could not be deleted }
 */
export async function PATCH(request: Request, { params }: Context) {
  const id = Number((await params).id);
  const { name, commonTypeId } = (await request.json()) as { name?: string; commonTypeId?: number };
  if (!name?.trim() || !commonTypeId) return NextResponse.json({ message: "Name and commonTypeId are required" }, { status: 400 });
  const commonType = await prisma.commonMasterType.findUnique({ where: { id: Number(commonTypeId) } });
  if (!commonType) return NextResponse.json({ message: "Common type not found" }, { status: 404 });
  return NextResponse.json(await prisma.commonMaster.update({ where: { id }, data: { name: name.trim(), commonTypeId: commonType.id, commonTypeName: commonType.name }, include: { commonType: true } }));
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await prisma.commonMaster.delete({ where: { id: Number((await params).id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete common master" }, { status: 409 });
  }
}