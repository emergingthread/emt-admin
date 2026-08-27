-- CreateTable
CREATE TABLE "CommonMasterType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CommonMasterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "commonTypeId" INTEGER NOT NULL,
    "commonTypeName" TEXT NOT NULL,

    CONSTRAINT "CommonMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommonMasterType_name_key" ON "CommonMasterType"("name");

-- CreateIndex
CREATE INDEX "CommonMaster_commonTypeId_idx" ON "CommonMaster"("commonTypeId");

-- AddForeignKey
ALTER TABLE "CommonMaster" ADD CONSTRAINT "CommonMaster_commonTypeId_fkey" FOREIGN KEY ("commonTypeId") REFERENCES "CommonMasterType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
