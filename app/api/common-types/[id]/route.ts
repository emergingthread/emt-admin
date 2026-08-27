import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/common-types/{id}:
 *   patch:
 *     tags: [Common Types]
 *     summary: Update a common type
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
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Common type updated }
 *       400: { description: Invalid request }
 *       409: { description: Common type could not be updated }
 *   delete:
 *     tags: [Common Types]
 *     summary: Delete a common type
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Common type deleted }
 *       409: { description: Common type could not be deleted }
 */
export async function PATCH(request: Request, { params }: Context) {
  const id = Number((await params).id);
  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ message: "Name is required" }, { status: 400 });
  try {
    return NextResponse.json(await prisma.commonMasterType.update({ where: { id }, data: { name: name.trim() } }));
  } catch {
    return NextResponse.json({ message: "Unable to update common type" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = Number((await params).id);
  try {
    await prisma.commonMasterType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete common type" }, { status: 409 });
  }
}