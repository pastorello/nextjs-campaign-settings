-- SPEC-004 T1: `faction` becomes a real table, with an FK from `npc.fazione`.
--
-- Written by hand rather than generated with `prisma migrate dev`/`deploy`,
-- same reason as every migration since M1 (see TD-63): this dev database's
-- history has a gap `migrate dev`'s shadow-database replay cannot get past.
-- Rendered with `prisma migrate diff --from-config-datasource --to-schema
-- prisma/schema.prisma --script` against the real dev database for the
-- CREATE TABLE and ADD CONSTRAINT (that diff also proposed an unrelated
-- `DROP TABLE "customers"` — a known, already-documented tutorial leftover,
-- excluded here), plus the seed INSERTs by hand.
--
-- Pre-migration audit (SPEC-003 §8, inherited by this item): every distinct
-- `npc.fazione` value in the live dev database is one of the 21 below —
-- confirmed 2026-08-06 with `SELECT fazione, count(*) FROM npc GROUP BY
-- fazione ORDER BY fazione`. No orphan, nothing at the gaps (9, 20). Safe to
-- add the FK with zero rows needing repair.
--
-- Ids are exactly `factions.ts`'s existing `value`s, gaps at 9 and 20
-- included — not renumbered, so no `npc.fazione` value changes and the FK
-- addition is the whole migration (SPEC-003 §6's reasoning, reused here).
-- `name` is the Faction enum's own string — campaign content, never
-- translated (CLAUDE.md) — not a message-catalogue key: `factions.ts`'s
-- `labelKey`s stay exactly where they are, since the metadata layer keeps
-- reading that static list unchanged (SPEC-004 §7).
CREATE TABLE "faction" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "faction_pkey" PRIMARY KEY ("id")
);

INSERT INTO "faction" ("id", "name") VALUES
    (0, 'Regno di Kang'),
    (1, 'Orda dei Pelleverde'),
    (2, 'Sultani di Solenero'),
    (3, 'Elfi Lunari'),
    (4, 'Nani di Butwhag'),
    (5, 'Orde dei Barbari'),
    (6, 'Regno di Blackthorne'),
    (7, 'Contea di Valleferro'),
    (8, 'Ducato di Skreebars'),
    (10, 'Raminghi'),
    (11, 'Custodi della Fiamma'),
    (12, 'Custodi dell''Albero Sacro'),
    (13, 'Custodi delle Rune'),
    (14, 'Accademia degli Illuminati'),
    (15, 'Scuola dell''Invisibile'),
    (16, 'Congrega delle Megere'),
    (17, 'Cavalieri dell''Ordine della Rosa'),
    (18, 'Demoni Rossi'),
    (19, 'Annunaki'),
    (21, 'Folletti'),
    (22, 'Mano Nera');

-- AddForeignKey
ALTER TABLE "npc" ADD CONSTRAINT "npc_fazione_fkey" FOREIGN KEY ("fazione") REFERENCES "faction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
