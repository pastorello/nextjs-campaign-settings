import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";

// SPEC-018 T3 — same harness situation spec013CampaignSchema.test.ts
// documents: no DB-backed unit tier exists, so these tests assert against the
// migration SQL, the artifact that actually runs. The SQL is exactly what
// `prisma migrate diff --from-schema <main's schema> --to-schema
// prisma/schema.prisma --script` printed; CI's e2e job applies the whole
// chain to a disposable Postgres with `migrate deploy`.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec018_campaign_system")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-018 T3 migration folder (*_spec018_campaign_system) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

describe("SPEC-018 T3 — campaign.system migration", () => {
  it("backfills every existing campaign to the default system", () => {
    // Postgres fills a NOT NULL column added with a DEFAULT on every existing
    // row, so the DEFAULT is the backfill (§6: "campaign.system = 'dnd5e' for
    // every existing row, and nothing else").
    expect(sql).toMatch(
      new RegExp(
        `ALTER TABLE "campaign" ADD COLUMN\\s+"system" TEXT NOT NULL DEFAULT '${DEFAULT_GAME_SYSTEM}'`
      )
    );
  });

  it("is purely additive: no drops, no updates, no other tables", () => {
    expect(sql).not.toMatch(/DROP /i);
    expect(sql).not.toMatch(/UPDATE /);
    expect(sql).not.toMatch(/CREATE TABLE/);
    const altered = [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1]);
    expect(new Set(altered)).toEqual(new Set(["campaign"]));
  });
});
