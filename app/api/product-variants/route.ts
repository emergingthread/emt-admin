import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAuthResponse } from "@/lib/auth";
import { normalizeVariantInput, skuForSize, toVariantResponse, validateVariantReferences, variantError, variantInclude } from "@/lib/product-variants";

/**
 * @swagger
 * /api/product-variants:
 *   get:
 *     tags: [Product Variants]
 *     summary: List product variants
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: productId, schema: { type: integer } }
 *       - { in: query, name: colorId, schema: { type: integer } }
 *       - { in: query, name: sizeId, schema: { type: integer } }
 *       - { in: query, name: sort, schema: { type: string, enum: [createdAt, sku, price] } }
 *       - { in: query, name: direction, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Paginated variants returned }
 *       401: { description: Authentication required }
 *   post:
 *     tags: [Product Variants]
 *     summary: Create product variants for one or more sizes
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantInput' }
 *     responses:
 *       201: { description: Variants created }
 *       400: { description: Invalid input or referenced value }
 *       409: { description: Duplicate SKU or combination }
 */

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || url.searchParams.get("pageSize") || 10)));
  const search = url.searchParams.get("search")?.trim();
  const productId = Number(url.searchParams.get("productId"));
  const colorId = Number(url.searchParams.get("colorId"));
  const sizeId = Number(url.searchParams.get("sizeId"));
  const where: Prisma.ProductVariantWhereInput = {
    ...(search ? { OR: [{ sku: { contains: search, mode: "insensitive" } }, { productColor: { product: { name: { contains: search, mode: "insensitive" } } } }, { productColor: { product: { code: { contains: search, mode: "insensitive" } } } }] } : {}),
    ...(Number.isInteger(productId) && productId > 0 ? { productColor: { productId } } : {}),
    ...(Number.isInteger(colorId) && colorId > 0 ? { productColor: { colorId } } : {}),
    ...(Number.isInteger(sizeId) && sizeId > 0 ? { sizeId } : {}),
  };
  const sort = ["sku", "price"].includes(url.searchParams.get("sort") || "") ? url.searchParams.get("sort") as "sku" | "price" : "createdAt";
  const direction = url.searchParams.get("direction") === "asc" ? "asc" : "desc";
  const [items, total] = await Promise.all([
    prisma.productVariant.findMany({ where, include: variantInclude, orderBy: { [sort]: direction }, skip: (page - 1) * limit, take: limit }),
    prisma.productVariant.count({ where }),
  ]);
  return NextResponse.json({ items: items.map(toVariantResponse), total, page, limit });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  try {
    const input = normalizeVariantInput(await request.json());
    const { error, sizes } = await validateVariantReferences(input);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    const sizeById = new Map(sizes.map((size) => [size.id, size]));
    const variants = await prisma.$transaction(async (transaction) => {
      const productColor = await transaction.productColor.upsert({ where: { productId_colorId: { productId: input.productId, colorId: input.colorId } }, create: { productId: input.productId, colorId: input.colorId }, update: {} });
      if (input.images.length) {
        await transaction.productColorImage.deleteMany({ where: { productColorId: productColor.id } });
        await transaction.productColor.update({ where: { id: productColor.id }, data: { images: { create: input.images } } });
      }
      return Promise.all(input.sizeIds.map((sizeId) => transaction.productVariant.create({
        data: {
          productColorId: productColor.id,
          sizeId,
          sku: skuForSize(input.sku, sizeById.get(sizeId)?.name || String(sizeId), input.sizeIds.length),
          price: input.price,
          createdBy: auth.id,
        },
        include: variantInclude,
      })));
    });
    return NextResponse.json({ items: variants.map(toVariantResponse), total: variants.length }, { status: 201 });
  } catch (error) {
    console.error("Product variant create failed:", error);
    const code = (error as { code?: string })?.code;
    return NextResponse.json({ message: variantError(error) }, { status: code === "P2002" ? 409 : 500 });
  }
}
