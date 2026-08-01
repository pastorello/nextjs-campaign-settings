-- TD-14 / SPEC-002: map POI persistence.
--
-- Written by hand rather than generated with `prisma migrate dev`, for the
-- same reason TD-11's migration was: this development database was built
-- with `db push` and only its most recent migration (the png->npc rename) is
-- recorded in `_prisma_migrations`, so `migrate dev`'s shadow-database replay
-- misreads the history and fails with a spurious P1014 on the earlier,
-- already-applied migrations. Verified instead by:
--   1. replaying every migration file in order on a throwaway database
--      (docker exec ... psql) and confirming each applies cleanly, and
--   2. `prisma migrate diff --from-config-datasource --to-schema
--      prisma/schema.prisma --script` against the real dev database, which
--      renders exactly this SQL and nothing else — proving no other drift
--      exists to fix incidentally.
--
-- `linkedType` + `linkedId` are a polymorphic pair, not a foreign key: a POI
-- links to exactly one entity of any future linkable type without a schema
-- change per type. Postgres cannot enforce that `linkedId` exists in
-- whichever table `linkedType` names — that check lives at the Zod boundary,
-- the same tradeoff already made for `category`. See SPEC-002 §6.
CREATE TABLE "poi" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "linkedType" TEXT,
    "linkedId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poi_linkedType_linkedId_idx" ON "poi"("linkedType", "linkedId");
