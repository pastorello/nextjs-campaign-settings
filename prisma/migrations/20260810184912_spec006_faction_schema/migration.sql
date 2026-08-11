-- SPEC-006 T1 — renumber id 0 -> 23 before the sequence exists, so the
-- ON UPDATE CASCADE FK carries every referencing npc row with it.
UPDATE "faction" SET "id" = 23 WHERE "id" = 0;

-- AlterTable
CREATE SEQUENCE faction_id_seq;
ALTER TABLE "faction" ADD COLUMN     "descrizione" TEXT,
ALTER COLUMN "id" SET DEFAULT nextval('faction_id_seq');
ALTER SEQUENCE faction_id_seq OWNED BY "faction"."id";

-- Start the sequence past the legacy maximum id (23, after the renumber
-- above) so the next insert does not collide with an existing row.
SELECT setval('faction_id_seq', (SELECT MAX("id") FROM "faction"));

-- AlterTable
ALTER TABLE "npc" ALTER COLUMN "fazione" DROP NOT NULL;
