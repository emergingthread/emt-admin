import { Prisma } from "@/generated/prisma/client";

export const productMasterFields = [
  "categoryId", "collectionId", "genderId", "materialId", "fitId", "necklineId",
  "sleeveTypeId", "occasionId", "patternId", "seasonId", "lengthId", "careInstructionsId", "productStatusId",
] as const;

export type ProductImageInput = {
  id?: number;
  imageUrl: string;
  publicId: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
};

export function normalizeProductInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const categoryId = Number(body.categoryId);
  const genderId = Number(body.genderId);
  if (!name || !code || !slug || !Number.isInteger(categoryId) || !Number.isInteger(genderId)) {
    throw new Error("Name, code, slug, category, and gender are required");
  }

  const masterIds = Object.fromEntries(productMasterFields.map((field) => {
    const value = body[field];
    return [field, value === "" || value === null || value === undefined ? null : Number(value)];
  })) as Record<(typeof productMasterFields)[number], number | null>;
  if (Object.values(masterIds).some((value) => value !== null && !Number.isInteger(value))) throw new Error("Master IDs must be valid integers");

  const images = Array.isArray(body.images) ? body.images as ProductImageInput[] : [];
  if (images.some((image) => !image.imageUrl || !image.publicId)) throw new Error("Every image must include a URL and public ID");
  const primaryCount = images.filter((image) => image.isPrimary).length;
  if (primaryCount > 1) throw new Error("Only one image can be primary");

  return {
    name, code, slug,
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    ...masterIds, categoryId, genderId,
    isActive: body.isActive !== false,
    images: images.map((image, index) => ({
      id: image.id ? Number(image.id) : undefined,
      imageUrl: image.imageUrl,
      publicId: image.publicId,
      altText: image.altText?.trim() || null,
      isPrimary: Boolean(image.isPrimary),
      displayOrder: Number.isInteger(image.displayOrder) ? image.displayOrder as number : index,
    })),
  };
}

export const productInclude = {
  images: { orderBy: { displayOrder: "asc" as const } },
  category: true,
  collection: true,
  gender: true,
  material: true,
  fit: true,
  neckline: true,
  sleeveType: true,
  occasion: true,
  pattern: true,
  season: true,
  length: true,
  careInstructions: true,
  productStatus: true,
};

export function productError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return "A product with this code or slug already exists";
  if (code === "P2003") return "One or more referenced master values are invalid";
  if (code === "P2021" || code === "P2022") return "Product database tables or columns are missing. Run the latest Prisma migration.";
  if (error instanceof Error && error.message) return error.message;
  return "Unable to save product";
}
