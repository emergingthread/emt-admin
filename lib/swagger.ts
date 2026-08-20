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
      tags: [
        { name: "Authentication" },
        { name: "Common Masters" },
        { name: "Common Types" },
        { name: "Menus" },
      ],
    },
  });
}