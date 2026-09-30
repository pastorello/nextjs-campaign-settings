-- SPEC-022 T1: an account carries a role and can be disabled.
--
-- New accounts default to `player`, the side that can change nothing. Every
-- account that exists before this migration was, by definition, the DM's:
-- there was only one kind of account. It is backfilled to `dm` in the same
-- migration, or the DM would lock themselves out of their own app.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'player';

-- Backfill
UPDATE "users" SET "role" = 'dm';

-- A closed vocabulary in code (`UserRole`); the database refuses anything else.
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('dm', 'player'));
