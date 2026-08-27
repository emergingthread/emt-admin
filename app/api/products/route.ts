import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAuthResponse } from "@/lib/auth";
import { normalizeProductInput, productError, productInclude } from "@/lib/products";

async function validateMasters(product: ReturnType<typeof normalizeProductInput>) {
  const ids: number[] = [product.categoryId, product.genderId, ...Object.values(product).filter((value): value is number => typeof value === "number")];
  const uniqueIds = [...new Set(ids)];
  const count = await prisma.commonMaster.count({ where: { id: { in: uniqueIds } } });
  return count >= uniqueIds.length;
}

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: pageSize, schema: { type: integer, minimum: 1, maximum: 50 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *       - { in: query, name: genderId, schema: { type: integer } }
 *       - { in: query, name: sort, schema: { type: string, enum: [name, createdAt] } }
 *       - { in: query, name: direction, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Paginated products returned }
 *       401: { description: Authentication required }
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       201: { description: Product created }
 *       400: { description: Invalid product or master values }
 *       409: { description: Code or slug already exists }
 *       401: { description: Authentication required }
 */

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
  const search = url.searchParams.get("search")?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] } : {}),
    ...(url.searchParams.get("isActive") ? { isActive: url.searchParams.get("isActive") === "true" } : {}),
    ...(url.searchParams.get("categoryId") ? { categoryId: Number(url.searchParams.get("categoryId")) } : {}),
    ...(url.searchParams.get("genderId") ? { genderId: Number(url.searchParams.get("genderId")) } : {}),
  };
  const sort = url.searchParams.get("sort") === "name" ? "name" : "createdAt";
  const direction = url.searchParams.get("direction") === "asc" ? "asc" : "desc";
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy: { [sort]: direction }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  try {
    const input = normalizeProductInput(await request.json());
    if (!(await validateMasters(input))) return NextResponse.json({ message: "One or more master values are invalid" }, { status: 400 });
    const { images, ...productData } = input;
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: { create: images.map((image) => ({ imageUrl: image.imageUrl, publicId: image.publicId, altText: image.altText, isPrimary: image.isPrimary, displayOrder: image.displayOrder })) },
        createdBy: auth.id,
      },
      include: productInclude,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create failed:", error);
    if (error instanceof Error && (error.message.includes("required") || error.message.includes("IDs") || error.message.includes("image"))) return NextResponse.json({ message: error.message }, { status: 400 });
    const code = (error as { code?: string })?.code;
    return NextResponse.json({ message: productError(error) }, { status: code === "P2002" ? 409 : 500 });
  }
}
