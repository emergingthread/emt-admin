import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "EMT Admin API",
        version: "1.0.0",
        description: "API documentation for the EMT Admin application.",
      },
      servers: [{ url: "/", description: "Current application" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
          ProductInput: {
            type: "object",
            required: ["name", "code", "slug", "categoryId", "genderId"],
            properties: {
              name: { type: "string", example: "Cord Set" },
              code: { type: "string", example: "CORD1" },
              slug: { type: "string", example: "cord-set" },
              description: { type: "string", nullable: true },
              categoryId: { type: "integer" }, collectionId: { type: "integer", nullable: true },
              genderId: { type: "integer" }, materialId: { type: "integer", nullable: true },
              fitId: { type: "integer", nullable: true }, necklineId: { type: "integer", nullable: true },
              sleeveTypeId: { type: "integer", nullable: true }, occasionId: { type: "integer", nullable: true },
              patternId: { type: "integer", nullable: true }, seasonId: { type: "integer", nullable: true },
              lengthId: { type: "integer", nullable: true }, careInstructionsId: { type: "integer", nullable: true },
              productStatusId: { type: "integer", nullable: true }, isActive: { type: "boolean", default: true },
            },
          },
          ProductImageInput: {
            type: "object",
            required: ["imageUrl", "publicId"],
            properties: {
              imageUrl: { type: "string", format: "uri" }, publicId: { type: "string" },
              altText: { type: "string" }, isPrimary: { type: "boolean" }, displayOrder: { type: "integer" },
            },
          },
          ProductVariantInput: {
            type: "object",
            required: ["productId", "colorId", "sizeIds", "sku", "price"],
            properties: {
              productId: { type: "integer" }, colorId: { type: "integer" },
              sizeIds: { type: "array", items: { type: "integer" }, minItems: 1, example: [12, 13, 14] },
              sizeId: { type: "integer", deprecated: true, description: "Accepted for compatibility; prefer sizeIds" },
              sku: { type: "string", example: "LCS001-BEI" }, price: { type: "number", format: "double", exclusiveMinimum: 0 },
              images: { type: "array", items: { $ref: "#/components/schemas/ProductImageInput" } },
            },
          },
        },
      },
      tags: [
        { name: "Authentication" },
        { name: "Common Masters" },
        { name: "Common Types" },
        { name: "Menus" },
        { name: "Products" },
        { name: "Product Variants" },
      ],
    },
  });
}