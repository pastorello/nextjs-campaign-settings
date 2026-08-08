-- AlterTable
ALTER TABLE "deities" ADD COLUMN     "poiId" INTEGER,
ADD COLUMN     "zoneId" INTEGER;

-- AlterTable
ALTER TABLE "npc" ADD COLUMN     "poiId" INTEGER,
ADD COLUMN     "zoneId" INTEGER;

-- CreateTable
CREATE TABLE "zone" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "parentId" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "mapImage" TEXT,
    "mapBounds" JSONB,
    "mapInitialView" JSONB,
    "mapInitialZoom" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zone_parentId_idx" ON "zone"("parentId");

-- AddForeignKey
ALTER TABLE "deities" ADD CONSTRAINT "deities_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deities" ADD CONSTRAINT "deities_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "poi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc" ADD CONSTRAINT "npc_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc" ADD CONSTRAINT "npc_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "poi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone" ADD CONSTRAINT "zone_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

