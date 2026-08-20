ALTER TABLE "Menu" RENAME COLUMN "path" TO "route";
ALTER TABLE "Menu" RENAME COLUMN "sortOrder" TO "displayOrder";
ALTER TABLE "Menu" ALTER COLUMN "route" DROP NOT NULL;
ALTER TABLE "Menu" ADD COLUMN "parentId" INTEGER;
ALTER TABLE "Menu" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Menu" DROP CONSTRAINT IF EXISTS "Menu_path_key";
CREATE UNIQUE INDEX "Menu_route_key" ON "Menu"("route");
CREATE INDEX "Menu_parentId_idx" ON "Menu"("parentId");
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
