-- SPEC-004 M4: `lat`, `lng` and `category` become nullable on `poi`.
--
-- The tree's root `region` (created by the "create your world" flow) has no
-- parent map to be positioned on, so no `lat`/`lng`; and no `category` —
-- that field belongs to `kind: "poi"` per SPEC-004 §5.1's table. Purely
-- relaxing a constraint, not dropping a column: every existing row keeps its
-- values unchanged.
--
-- Written by hand rather than generated with `prisma migrate dev`/`deploy`,
-- same reason as `20260806120000_add_poi_kind_parent_map_columns` (see
-- TD-63) — plus this dev database's live diff also proposed `DROP TABLE
-- "customers"`, an unrelated pre-existing table this migration history
-- never created and this change has nothing to do with. Excluded here.
ALTER TABLE "poi" ALTER COLUMN "lat" DROP NOT NULL,
ALTER COLUMN "lng" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;
