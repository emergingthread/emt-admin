import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ImageInput = { imageUrl?: string; publicId?: string; altText?: string; isPrimary?: boolean; displayOrder?: number };

export function normalizeVariantInput(body: Record<string, unknown>) {
  const productId = Number(body.productId);
  const colorId = Number(body.colorId);
  const rawSizes = Array.isArray(body.sizeIds) ? body.sizeIds : body.sizeId != null ? [body.sizeId] : [];
  const sizeIds = [...new Set(rawSizes.map((value) => Number(value)).filter((id) => Number.isInteger(id) && id > 0))];
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const price = typeof body.price === "number" || typeof body.price === "string" ? Number(body.price) : NaN;
  const images = Array.isArray(body.images) ? body.images as ImageInput[] : [];

  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(colorId) || colorId < 1 || !sizeIds.length || !sku || !Number.isFinite(price) || price <= 0) {
    throw new Error("Product, color, at least one size, SKU, and a price greater than zero are required");
  }

  if (images.some((image) => !image.imageUrl || !image.publicId)) throw new Error("Every image must include a URL and public ID");
  return {
    productId, colorId, sizeIds, sku, price,
    images: images.map((image, index) => ({
      imageUrl: image.imageUrl as string,
      publicId: image.publicId as string,
      altText: image.altText?.trim() || null,
      isPrimary: Boolean(image.isPrimary),
      displayOrder: Number.isInteger(image.displayOrder) ? image.displayOrder as number : index,
    })),
  };
}

export function skuForSize(baseSku: string, sizeName: string, sizeCount: number) {
  if (sizeCount === 1) return baseSku;
  return `${baseSku}-${sizeName.replace(/\s+/g, "").toUpperCase()}`;
}

export const variantInclude = {
  productColor: { include: { product: { select: { id: true, name: true, code: true } }, color: { select: { id: true, name: true, commonTypeName: true } }, images: { orderBy: { displayOrder: "asc" as const } } } },
  size: { select: { id: true, name: true, commonTypeName: true } },
};

type VariantRecord = {
  id: number;
  sku: string;
  price: Prisma.Decimal | number | string;
  sizeId: number;
  createdAt: Date;
  updatedAt: Date;
  size: { id: number; name: string; commonTypeName: string };
  productColor: {
    product: { id: number; name: string; code: string };
    color: { id: number; name: string; commonTypeName: string };
    images: Array<{ imageUrl: string; publicId: string; altText: string | null; isPrimary: boolean; displayOrder: number }>;
  };
};

export function toVariantResponse(variant: VariantRecord) {
  return {
    id: variant.id,
    productId: variant.productColor.product.id,
    colorId: variant.productColor.color.id,
    sizeId: variant.sizeId,
    sizeIds: [variant.sizeId],
    sku: variant.sku,
    price: variant.price,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    product: variant.productColor.product,
    color: variant.productColor.color,
    size: variant.size,
    images: variant.productColor.images,
  };
}

export async function validateVariantReferences(input: ReturnType<typeof normalizeVariantInput>) {
  const [product, color, sizes] = await Promise.all([
    prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } }),
    prisma.commonMaster.findUnique({ where: { id: input.colorId }, select: { id: true, commonTypeName: true } }),
    prisma.commonMaster.findMany({ where: { id: { in: input.sizeIds } }, select: { id: true, name: true, commonTypeName: true } }),
  ]);
  if (!product) return { error: "Product not found" as const, sizes: [] };
  if (!color || !color.commonTypeName.toLowerCase().includes("color")) return { error: "Color master value not found" as const, sizes: [] };
  if (sizes.length !== input.sizeIds.length || sizes.some((size) => !size.commonTypeName.toLowerCase().includes("size"))) {
    return { error: "One or more size master values were not found" as const, sizes: [] };
  }
  return { error: null, sizes };
}

export function variantError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return "SKU or product, color, and size combination already exists";
  if (code === "P2003") return "One or more referenced values are invalid";
  if (code === "P2021" || code === "P2022") return "ProductVariant database table or columns are missing. Run the latest Prisma migration.";
  if (error instanceof Error && error.message) return error.message;
  return "Unable to save product variant";
}

export { Prisma };
