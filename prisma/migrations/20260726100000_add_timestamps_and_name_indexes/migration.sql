-- TD-11: audit timestamps and the index every list query has always needed.
--
-- Written by hand rather than generated with `prisma migrate dev`, because the
-- development database here is built with `db push` and has no migration
-- baseline — `migrate dev` would detect that as drift and offer to reset it.
-- Verified instead the way TD-23 was: replay every migration onto a throwaway
-- database, seed it, and confirm `prisma migrate diff` finds no difference.

-- Timestamps on all five models. `updatedAt` needs a default for the backfill
-- of existing rows; Prisma sets it explicitly on every write from here on, so
-- the default only ever applies to rows that predate this migration.
ALTER TABLE "deities"    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "magicitems" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "png"        ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "spells"     ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users"      ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Every list page filters and sorts on `nome`; without this each one is a
-- sequential scan. `users` is excluded — it is queried by `email`, which is
-- already unique and therefore already indexed.
CREATE INDEX "deities_nome_idx"    ON "deities"("nome");
CREATE INDEX "magicitems_nome_idx" ON "magicitems"("nome");
CREATE INDEX "png_nome_idx"        ON "png"("nome");
CREATE INDEX "spells_nome_idx"     ON "spells"("nome");

-- The orphan left by TD-26. `sottoclassi` was the unused twin of `circolo`
-- after the two concepts converged; the code stopped referencing it then, and
-- the column is empty in the development database *and* in all 361 rows of the
-- DM's real spell library, both checked before writing this.
ALTER TABLE "spells" DROP COLUMN "sottoclassi";

-- The default above exists only to backfill existing rows. `@updatedAt` is
-- maintained by Prisma on every write and carries no database default, so
-- leaving one behind is drift — `prisma migrate diff` reports it as
-- "default changed from Some(Now) to None". `createdAt` keeps its default,
-- which is what `@default(now())` means.
ALTER TABLE "deities"    ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "magicitems" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "png"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "spells"     ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "users"      ALTER COLUMN "updatedAt" DROP DEFAULT;
