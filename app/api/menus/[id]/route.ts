import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/menus/{id}:
 *   patch:
 *     tags: [Menus]
 *     summary: Update a menu
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
 *             required: [name, icon, displayOrder]
 *             properties:
 *               name: { type: string }
 *               parentId: { type: integer, nullable: true }
 *               route: { type: string, nullable: true }
 *               icon: { type: string }
 *               displayOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Menu updated }
 *       400: { description: Invalid request }
 *       409: { description: Menu could not be updated }
 *   delete:
 *     tags: [Menus]
 *     summary: Delete a menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Menu deleted }
 *       409: { description: Menu could not be deleted }
 */
export async function PATCH(request: Request, { params }: Context) {
  const { name, parentId, route, path, icon, displayOrder, sortOrder, isActive } = (await request.json()) as { name?: string; parentId?: number | null; route?: string | null; path?: string; icon?: string; displayOrder?: number; sortOrder?: number; isActive?: boolean };
  if (!name?.trim() || !icon?.trim()) return NextResponse.json({ message: "Name and icon are required" }, { status: 400 });
  try {
    return NextResponse.json(await prisma.menu.update({ where: { id: Number((await params).id) }, data: { name: name.trim(), parentId: parentId ? Number(parentId) : null, route: route?.trim() || path?.trim() || null, icon: icon.trim(), displayOrder: Number(displayOrder ?? sortOrder) || 0, isActive: isActive ?? true } }));
  } catch {
    return NextResponse.json({ message: "Unable to update menu" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await prisma.menu.delete({ where: { id: Number((await params).id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete menu" }, { status: 409 });
  }
}