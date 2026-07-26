-- Reconciles the initial migration with prisma/schema.prisma (TD-23).
--
-- `20251126152855_resetio` has never actually run: the README sets a database
-- up with `prisma db push`, which syncs the schema directly and never reads a
-- migration, so every developer machine and every manual check took that path.
-- CI's e2e job is the only place that runs `prisma migrate deploy`, and it only
-- started reaching that step once the test job went green.
--
-- When it did, four drifts surfaced. Comparing column *names* finds only the
-- first two; `prisma migrate diff` against the schema finds the rest, which is
-- the check to trust:
--
--   1. `spells` is missing `nome`, which the schema declares and the seed
--      inserts. This is what fails the e2e job, at `pnpm db:seed`:
--      `column "nome" of relation "spells" does not exist`.
--   2. Three tables the schema never had — `customers`, `invoices`, `revenue`
--      — Next.js Learn leftovers, the same tutorial origin TD-06 cleaned out of
--      the code. Nothing references them.
--   3. Eight `deities` columns are VARCHAR(255) here and `Int` in the schema.
--      These are the same fields TD-08 found declared as integers carrying
--      `defaultValue: ""` — they were strings once, the schema moved on, the
--      migration did not.
--   4. `png.descrizione` is NOT NULL here and `String?` in the schema.
--
--   3 and 4 do not fail the seed, which is why they stayed invisible. They
--   would fail the first time anything relied on the migration to reproduce
--   the schema.
--
-- This is deliberately a corrective migration rather than a regenerated one.
-- Regenerating means dropping and recreating the database, which TD-23
-- therefore deferred to TD-11; patching forward costs nothing, needs no reset,
-- and unblocks the e2e job now. TD-11 adds its timestamps and indexes on top as
-- a normal migration.

-- Added with a default so the statement is safe on a table that already has
-- rows, then dropped so the column matches the schema's bare `nome String`.
ALTER TABLE "spells" ADD COLUMN "nome" TEXT NOT NULL DEFAULT '';
ALTER TABLE "spells" ALTER COLUMN "nome" DROP DEFAULT;

-- IF EXISTS because a database built with `db push` never had these: they exist
-- only where the initial migration ran, which today means CI alone.
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "invoices";
DROP TABLE IF EXISTS "revenue";

-- The eight deities columns the schema declares as Int. `USING x::integer` is
-- required because Postgres will not widen varchar to integer implicitly; it
-- fails loudly on a non-numeric value, which is the behaviour to want. Safe
-- here: these tables are empty when the migration runs, and a machine set up
-- with `db push` already has them as integer.
ALTER TABLE "deities" ALTER COLUMN "tipopatrono" TYPE INTEGER USING "tipopatrono"::integer;
ALTER TABLE "deities" ALTER COLUMN "gradopatrono" TYPE INTEGER USING "gradopatrono"::integer;
ALTER TABLE "deities" ALTER COLUMN "card" TYPE INTEGER USING "card"::integer;
ALTER TABLE "deities" ALTER COLUMN "astri" TYPE INTEGER USING "astri"::integer;
ALTER TABLE "deities" ALTER COLUMN "elemento" TYPE INTEGER USING "elemento"::integer;
ALTER TABLE "deities" ALTER COLUMN "classe" TYPE INTEGER USING "classe"::integer;
ALTER TABLE "deities" ALTER COLUMN "tradizione" TYPE INTEGER USING "tradizione"::integer;
ALTER TABLE "deities" ALTER COLUMN "residenza" TYPE INTEGER USING "residenza"::integer;

-- The schema declares `descrizione String?`.
ALTER TABLE "png" ALTER COLUMN "descrizione" DROP NOT NULL;
