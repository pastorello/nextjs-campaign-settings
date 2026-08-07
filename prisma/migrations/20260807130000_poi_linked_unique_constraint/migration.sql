-- TD-69: a second `poi` pin for the same `(linkedType, linkedId)` pair (e.g.
-- two pins for the same deity) was silently possible — only a lookup index
-- existed, no uniqueness guarantee. SPEC-004 §6 documents this pair as
-- `@@unique`, but the constraint was never actually added when M2 built the
-- column.
--
-- Audited first: `SELECT "linkedType", "linkedId", count(*) FROM poi WHERE
-- "linkedType" IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1` against the live
-- dev database returned zero rows, so this constraint has nothing existing to
-- reject.
--
-- Written by hand rather than generated with `prisma migrate dev`, for the
-- same reason every migration since `add_poi_table` has been (TD-63): this
-- development database was built with `db push` and its migration history
-- has a gap `migrate dev`'s shadow-database replay cannot get past.
-- `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma
-- --script` against the real dev database also reported a `DROP TABLE
-- "customers"` — an unrelated, pre-existing empty leftover table, not part of
-- this schema and not touched here. Deliberately excluded: dropping it is
-- TD-63/TD-06-shaped cleanup, not TD-69's concern, and does not belong in the
-- same migration as an unrelated constraint.

-- DropIndex
DROP INDEX "poi_linkedType_linkedId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "poi_linkedType_linkedId_key" ON "poi"("linkedType", "linkedId");
