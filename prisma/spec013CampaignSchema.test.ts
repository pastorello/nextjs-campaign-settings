import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-013 T2 — no DB-backed unit harness exists in this repo. The nearest
// precedent, app/lib/connections/prisma.test.ts, mocks PrismaClient and
// PrismaPg rather than touching a real Postgres, and nothing else in the
// suite reads a live DATABASE_URL (docs/TESTING.md's "Integration — Vitest
// against a real Postgres" tier describes an intent, not something built
// yet). Building that harness is out of scope for T2, so these tests assert
// against the generated migration SQL itself — the artifact that actually
// runs — rather than against live rows.
//
// The same three behaviours were also verified once, by hand, in a
// rolled-back transaction against `.env.test`'s database while implementing
// this migration (`prisma migrate deploy` applied clean; a zone delete left
// its scene alive with zoneId null; an npc delete left the sceneCreature's
// authored name/level/xpEach/quantity intact; an adventure delete cascaded
// its scene away; the backfill UPDATE set consumable true only for tipo 6
// and 7). This file is what keeps that guarantee from rotting silently
// afterwards, since nothing else in CI re-runs it against real data —
// beyond the e2e job, which applies every migration including this one to
// its own disposable Postgres before the suite runs.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec013_campaign_schema")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-013 T2 migration folder (*_spec013_campaign_schema) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

describe("SPEC-013 T2 — campaign schema migration", () => {
  it("applies clean to an empty database: purely additive, no drops", () => {
    // Six new tables plus the one new column, nothing torn down — applies
    // without conflict to a database that has never seen it, or to one that
    // already carries every prior migration.
    for (const table of [
      "campaign",
      "adventure",
      "scene",
      "sceneCreature",
      "loot",
      "treasure",
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE "${table}" `));
    }
    expect(sql).toMatch(
      /ALTER TABLE "magicitems" ADD COLUMN\s+"consumable" BOOLEAN NOT NULL DEFAULT false;/
    );
    expect(sql).not.toMatch(/DROP (TABLE|COLUMN)/i);
  });

  it("relations null rather than cascade where §6 says so", () => {
    // The full asymmetric delete-behaviour table from §6/§10 — a deleted
    // place must never take a scene down with it, but a deleted adventure
    // or scene does cascade what belongs only to it.
    const expectedOnDelete: Record<string, string> = {
      adventure_campaignId_fkey: "RESTRICT",
      scene_adventureId_fkey: "CASCADE",
      scene_zoneId_fkey: "SET NULL",
      sceneCreature_sceneId_fkey: "CASCADE",
      sceneCreature_npcId_fkey: "SET NULL",
      loot_sceneId_fkey: "CASCADE",
      loot_magicItemId_fkey: "SET NULL",
      loot_treasureId_fkey: "SET NULL",
    };

    for (const [constraint, action] of Object.entries(expectedOnDelete)) {
      const pattern = new RegExp(
        `CONSTRAINT "${constraint}" FOREIGN KEY[^;]*ON DELETE ${action}`
      );
      expect(sql, `${constraint} should be ON DELETE ${action}`).toMatch(
        pattern
      );
    }
  });

  it("backfill sets scroll and potion consumable and nothing else", () => {
    // scroll = 6, potion = 7 (app/lib/config/magicitem/item-types.ts).
    // Every other magicitems row keeps the schema's own false default, so
    // the backfill needs exactly one UPDATE, scoped to those two values.
    expect(sql).toMatch(
      /UPDATE "magicitems" SET "consumable" = true WHERE "tipo" IN \(6, 7\);/
    );
    expect(sql.match(/UPDATE "magicitems"/g)).toHaveLength(1);
  });
});
