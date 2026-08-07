-- TD-63: `20260730020000_rename_png_table_to_npc` renamed the table but not the
-- objects Postgres names after it. `ALTER TABLE ... RENAME TO` never renames a
-- table's primary-key constraint or its indexes, so a fresh sequential replay
-- of this history still ends with a table called `npc` whose primary key is
-- `png_pkey` and whose name index is `png_nome_idx` (created by the later
-- `20260726100000_add_timestamps_and_name_indexes`, itself run before the
-- table got renamed in migration order).
--
-- The maintainer's dev database does not have this drift: at some point it was
-- rebuilt with `db push`, which names constraints and indexes after the
-- model's *current* name, so it already has `npc_pkey`/`npc_nome_idx`. This
-- migration exists so a fresh clone reaches the same names without that
-- accidental detour, and so `prisma migrate diff` reports no difference on the
-- maintainer's database once this migration is marked applied.
ALTER TABLE "npc" RENAME CONSTRAINT "png_pkey" TO "npc_pkey";
ALTER INDEX "png_nome_idx" RENAME TO "npc_nome_idx";
