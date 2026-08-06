-- SPEC-004 M1 / M2: additive tree columns on `poi`.
--
-- Written by hand rather than generated with `prisma migrate dev`, for the
-- same reason `20260731120000_add_poi_table` was: this development database
-- was built with `db push`, so its `_prisma_migrations` history has gaps
-- `migrate dev`'s shadow-database replay cannot get past. Rendered instead
-- with `prisma migrate diff --from-config-datasource --to-schema
-- prisma/schema.prisma --script` against the real dev database, which
-- diffs the live schema directly and needs no shadow database.
--
-- Purely additive per SPEC-004 §5.1: `kind` defaults to `"poi"` and
-- `parentId`/the map columns default to NULL, so every existing row reads
-- back unchanged. Nothing here is referenced by application code yet — see
-- SPEC-004 §10 M3-M7.
ALTER TABLE "poi" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'poi',
ADD COLUMN     "mapBounds" JSONB,
ADD COLUMN     "mapImage" TEXT,
ADD COLUMN     "mapInitialView" JSONB,
ADD COLUMN     "mapInitialZoom" INTEGER,
ADD COLUMN     "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "poi_parentId_idx" ON "poi"("parentId");

-- AddForeignKey
ALTER TABLE "poi" ADD CONSTRAINT "poi_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "poi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
