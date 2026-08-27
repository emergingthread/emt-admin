import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAuthResponse } from "@/lib/auth";
import { normalizeVariantInput, skuForSize, toVariantResponse, validateVariantReferences, variantError, variantInclude } from "@/lib/product-variants";

type Context = { params: Promise<{ id: string }> };
function getId(value: string) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }

/**
 * @swagger
 * /api/product-variants/{id}:
 *   get:
 *     tags: [Product Variants]
 *     summary: View a product variant
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Variant returned }
 *       404: { description: Variant not found }
 *   put:
 *     tags: [Product Variants]
 *     summary: Update a product variant
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantInput' }
 *     responses:
 *       200: { description: Variant updated }
 *       400: { description: Invalid input or referenced value }
 *       409: { description: Duplicate SKU or combination }
 *   delete:
 *     tags: [Product Variants]
 *     summary: Delete a product variant
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Variant deleted }
 *       404: { description: Variant not found }
 */
export async function GET(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request); if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id); if (!id) return NextResponse.json({ message: "Invalid variant ID" }, { status: 400 });
  const variant = await prisma.productVariant.findUnique({ where: { id }, include: variantInclude });
  return variant ? NextResponse.json(toVariantResponse(variant)) : NextResponse.json({ message: "Product variant not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request); if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id); if (!id) return NextResponse.json({ message: "Invalid variant ID" }, { status: 400 });
  try {
    const input = normalizeVariantInput(await request.json());
    const { error, sizes } = await validateVariantReferences(input);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    const existing = await prisma.productVariant.findUnique({ where: { id }, select: { id: true, sizeId: true } });
    if (!existing) return NextResponse.json({ message: "Product variant not found" }, { status: 404 });
    const sizeById = new Map(sizes.map((size) => [size.id, size]));
    const primarySizeId = input.sizeIds.includes(existing.sizeId) ? existing.sizeId : input.sizeIds[0];
    const extraSizeIds = input.sizeIds.filter((sizeId) => sizeId !== primarySizeId);
    const variant = await prisma.$transaction(async (transaction) => {
      const productColor = await transaction.productColor.upsert({ where: { productId_colorId: { productId: input.productId, colorId: input.colorId } }, create: { productId: input.productId, colorId: input.colorId }, update: {} });
      if (input.images.length) {
        await transaction.productColorImage.deleteMany({ where: { productColorId: productColor.id } });
        await transaction.productColor.update({ where: { id: productColor.id }, data: { images: { create: input.images } } });
      }
      const updated = await transaction.productVariant.update({
        where: { id },
        data: {
          productColorId: productColor.id,
          sizeId: primarySizeId,
          sku: input.sku,
          price: input.price,
          updatedBy: auth.id,
        },
        include: variantInclude,
      });
      await Promise.all(extraSizeIds.map((sizeId) => transaction.productVariant.upsert({
        where: { productColorId_sizeId: { productColorId: productColor.id, sizeId } },
        create: {
          productColorId: productColor.id,
          sizeId,
          sku: skuForSize(input.sku, sizeById.get(sizeId)?.name || String(sizeId), 2),
          price: input.price,
          createdBy: auth.id,
        },
        update: { price: input.price, updatedBy: auth.id },
      })));
      return updated;
    });
    return NextResponse.json(toVariantResponse(variant));
  } catch (error) {
    console.error("Product variant update failed:", error);
    const code = (error as { code?: string })?.code;
    return NextResponse.json({ message: variantError(error) }, { status: code === "P2002" ? 409 : 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request); if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id); if (!id) return NextResponse.json({ message: "Invalid variant ID" }, { status: 400 });
  try {
    await prisma.productVariant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    return NextResponse.json({ message: code === "P2025" ? "Product variant not found" : "Unable to delete product variant" }, { status: code === "P2025" ? 404 : 500 });
  }
}
