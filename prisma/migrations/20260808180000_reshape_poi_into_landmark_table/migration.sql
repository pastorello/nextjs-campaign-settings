-- SPEC-008 T8: reshape the old, kind-discriminated `poi` table into the
-- landmark-only leaf (ADR-0010). Every surviving fact from the old shape
-- already lives elsewhere by this point:
--   - navigable-kind rows (region/plane/city/dungeon) -> `zone` (T2 backfill)
--   - entity pins (kind: "npc"/"deity")               -> npc/deities.zoneId (T2)
-- T7's verifier confirmed this immediately before this migration ran, and
-- the live database had zero `kind: "poi"` (landmark) rows to preserve — so
-- this DELETE is a no-op on real landmark data, not a loss.
DELETE FROM "poi";

-- DropForeignKey
ALTER TABLE "poi" DROP CONSTRAINT "poi_parentId_fkey";

-- DropIndex
DROP INDEX "poi_linkedType_linkedId_key";

-- DropIndex
DROP INDEX "poi_parentId_idx";

-- AlterTable
ALTER TABLE "poi" DROP COLUMN "kind",
DROP COLUMN "linkedId",
DROP COLUMN "linkedType",
DROP COLUMN "mapBounds",
DROP COLUMN "mapImage",
DROP COLUMN "mapInitialView",
DROP COLUMN "mapInitialZoom",
DROP COLUMN "parentId",
ADD COLUMN     "zoneId" INTEGER NOT NULL,
ALTER COLUMN "lat" SET NOT NULL,
ALTER COLUMN "lng" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL;

-- CreateIndex
CREATE INDEX "poi_zoneId_idx" ON "poi"("zoneId");

-- AddForeignKey
ALTER TABLE "poi" ADD CONSTRAINT "poi_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
