import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/menus:
 *   get:
 *     tags: [Menus]
 *     summary: List menus
 *     responses:
 *       200: { description: Menus returned }
 *   post:
 *     tags: [Menus]
 *     summary: Create a menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, icon, displayOrder]
 *             properties:
 *               name: { type: string, example: Dashboard }
 *               parentId: { type: integer, nullable: true, example: 2 }
 *               route: { type: string, nullable: true, example: /dashboard }
 *               icon: { type: string, example: LayoutDashboard }
 *               displayOrder: { type: integer, example: 1 }
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201: { description: Menu created }
 *       400: { description: Invalid request }
 *       409: { description: Menu path already exists }
 */
export async function GET() {
  const menus = await prisma.menu.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json(menus.map((menu) => ({ ...menu, path: menu.route, sortOrder: menu.displayOrder })));
}

export async function POST(request: Request) {
  const { name, parentId, route, path, icon, displayOrder, sortOrder, isActive } = (await request.json()) as { name?: string; parentId?: number | null; route?: string | null; path?: string; icon?: string; displayOrder?: number; sortOrder?: number; isActive?: boolean };
  if (!name?.trim() || !icon?.trim()) return NextResponse.json({ message: "Name and icon are required" }, { status: 400 });
  try {
    return NextResponse.json(await prisma.menu.create({ data: { name: name.trim(), parentId: parentId ? Number(parentId) : null, route: route?.trim() || path?.trim() || null, icon: icon.trim(), displayOrder: Number(displayOrder ?? sortOrder) || 0, isActive: isActive ?? true } }), { status: 201 });
  } catch {
    return NextResponse.json({ message: "A menu with this route already exists" }, { status: 409 });
  }
}