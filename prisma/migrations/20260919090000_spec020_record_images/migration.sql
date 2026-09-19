-- SPEC-020 T2 — record images (ADR-0017). Purely additive: one new table and
-- a nullable, unique "imageId" on each of the six owning tables that exist
-- today (SPEC-021 adds its Daggerheart domain table with the same column).
-- Exactly what `prisma migrate diff --from-schema <main schema> --to-schema
-- prisma/schema.prisma --script` printed; no backfill.

-- AlterTable
ALTER TABLE "deities" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "magicitems" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "npc" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "faction" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "zone" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "treasure" ADD COLUMN     "imageId" INTEGER;

-- CreateTable
CREATE TABLE "recordImage" (
    "id" SERIAL NOT NULL,
    "displayKey" TEXT NOT NULL,
    "thumbKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deities_imageId_key" ON "deities"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "magicitems_imageId_key" ON "magicitems"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "npc_imageId_key" ON "npc"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "faction_imageId_key" ON "faction"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "zone_imageId_key" ON "zone"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "treasure_imageId_key" ON "treasure"("imageId");

-- AddForeignKey
ALTER TABLE "deities" ADD CONSTRAINT "deities_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magicitems" ADD CONSTRAINT "magicitems_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc" ADD CONSTRAINT "npc_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction" ADD CONSTRAINT "faction_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone" ADD CONSTRAINT "zone_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure" ADD CONSTRAINT "treasure_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
