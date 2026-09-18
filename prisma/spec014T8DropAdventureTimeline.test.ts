import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-014 T8 — same harness situation spec013CampaignSchema.test.ts and
// spec014CalendarSchema.test.ts document: no DB-backed unit tier exists, so
// this asserts against the migration SQL itself, the artifact that actually
// runs. Hand-written, not `migrate diff` output — the guard block has no
// schema-level representation for Prisma to generate. CI's e2e job applies
// the whole migration chain with `migrate deploy` on every run.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec014_t8_drop_adventure_timeline")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-014 T8 migration folder (*_spec014_t8_drop_adventure_timeline) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

describe("SPEC-014 T8 — drop adventure.timeline migration", () => {
  it("guards with a RAISE EXCEPTION before the column is dropped", () => {
    const guardIndex = sql.indexOf("RAISE EXCEPTION");
    const dropIndex = sql.indexOf(
      'ALTER TABLE "adventure" DROP COLUMN "timeline"'
    );

    expect(guardIndex).toBeGreaterThan(-1);
    expect(dropIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(dropIndex);
  });

  it("checks for non-null, non-blank text — not merely a non-null column", () => {
    expect(sql).toMatch(/"timeline" IS NOT NULL AND btrim\("timeline"\) <> ''/);
  });

  it("wraps the guard in a DO block that runs before the drop", () => {
    expect(sql).toMatch(/DO \$\$[\s\S]*RAISE EXCEPTION[\s\S]*END \$\$;/);
  });

  it("drops exactly one column, and only on adventure", () => {
    const dropMatches = [...sql.matchAll(/DROP COLUMN "(\w+)"/g)];
    expect(dropMatches).toHaveLength(1);
    expect(dropMatches[0]?.[1]).toBe("timeline");

    const altered = new Set(
      [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1])
    );
    expect(altered).toEqual(new Set(["adventure"]));

    // Nothing else touched: no other DDL besides the guard and the drop.
    expect(sql).not.toMatch(/CREATE TABLE/i);
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toMatch(/UPDATE "\w+" SET/i);
    expect(sql).not.toMatch(/DELETE FROM/i);
  });
});
