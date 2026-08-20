import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-015 T1 — same harness situation spec013CampaignSchema.test.ts
// documents: no DB-backed unit tier exists, so these tests assert against
// the generated migration SQL — the artifact that actually runs. The
// migration was also applied once, for real, to the local dev database
// while implementing this task (`prisma migrate dev` ran it clean on a
// database carrying every prior migration; a fresh database gets it via
// the e2e job's `migrate deploy`, which applies the full chain to a
// disposable Postgres before the suite runs).

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec015_grid_schema")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-015 T1 migration folder (*_spec015_grid_schema) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

describe("SPEC-015 T1 — zone grid columns migration", () => {
  it("adds gridColumns and gridScale to zone, both nullable", () => {
    // Nullable is the load-bearing property: both columns unset is the
    // documented no-grid state every existing map starts in (§6), so the
    // ADD COLUMN must carry no NOT NULL and no DEFAULT.
    expect(sql).toMatch(
      /ALTER TABLE "zone" ADD COLUMN\s+"gridColumns" INTEGER/
    );
    expect(sql).toMatch(/ADD COLUMN\s+"gridScale" TEXT/);
    expect(sql).not.toMatch(/NOT NULL/);
    expect(sql).not.toMatch(/DEFAULT/);
  });

  it("is purely additive: no drops, no updates, no other tables", () => {
    // §6 says the change is reversible and touches nothing else — no
    // backfill is needed because null already means "no grid".
    expect(sql).not.toMatch(/DROP (TABLE|COLUMN)/i);
    expect(sql).not.toMatch(/UPDATE /);
    expect(sql).not.toMatch(/CREATE TABLE/);
    const altered = [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1]);
    expect(altered.length).toBeGreaterThan(0);
    expect(new Set(altered)).toEqual(new Set(["zone"]));
  });
});
