import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteProductImage } from "@/lib/cloudinary";
import { getAuthenticatedUser, isAuthResponse } from "@/lib/auth";
import { normalizeProductInput, productError, productInclude } from "@/lib/products";

type Context = { params: Promise<{ id: string }> };

function getId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function validateMasters(product: ReturnType<typeof normalizeProductInput>) {
  const ids: number[] = [product.categoryId, product.genderId, ...Object.values(product).filter((value): value is number => typeof value === "number")];
  const uniqueIds = [...new Set(ids)];
  return (await prisma.commonMaster.count({ where: { id: { in: uniqueIds } } })) === uniqueIds.length;
}

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: View a product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Product returned }
 *       404: { description: Product not found }
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       200: { description: Product updated }
 *       400: { description: Invalid product or master values }
 *       404: { description: Product not found }
 *       409: { description: Code or slug already exists }
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Product deleted }
 *       404: { description: Product not found }
 */

export async function GET(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id);
  if (!id) return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  return product ? NextResponse.json(product) : NextResponse.json({ message: "Product not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id);
  if (!id) return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
  try {
    const input = normalizeProductInput(await request.json());
    if (!(await validateMasters(input))) return NextResponse.json({ message: "One or more master values are invalid" }, { status: 400 });
    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    const product = await prisma.product.update({
      where: { id }, data: { ...input, updatedBy: auth.id }, include: productInclude,
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error && (error.message.includes("required") || error.message.includes("IDs"))) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: productError(error) }, { status: error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" ? 409 : 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  const id = getId((await params).id);
  if (!id) return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
  try {
    const product = await prisma.product.findUnique({ where: { id }, include: { colors: { include: { images: true } } } });
    if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    const colorImages = product.colors.flatMap((color) => color.images);
    await prisma.product.delete({ where: { id } });
    await Promise.all(colorImages.map((image) => deleteProductImage(image.publicId).catch(() => undefined)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete product" }, { status: 500 });
  }
}
