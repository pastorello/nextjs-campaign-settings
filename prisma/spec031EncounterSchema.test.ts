import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CHALLENGE_RATINGS } from "@/app/lib/config/dnd5e/challengeRatings";

// SPEC-031 T2 — asserted against the migration SQL, as the other prisma/*
// schema tests are (see spec013CampaignSchema.test.ts for why there is no
// live-database harness).

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec031_scene_creature_stats")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-031 T2 migration folder (*_spec031_scene_creature_stats) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

describe("SPEC-031 T2 — scene creature statistics migration", () => {
  it("is additive: two nullable columns on sceneCreature, nothing else", () => {
    expect(sql).toMatch(/ADD COLUMN\s+"challengeRating" TEXT,/);
    expect(sql).toMatch(/ADD COLUMN\s+"statsUrl" TEXT;/);
    const altered = new Set(
      [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1])
    );
    expect(altered).toEqual(new Set(["sceneCreature"]));
    expect(sql).not.toMatch(/DROP |UPDATE "|DELETE FROM|NOT NULL/i);
  });

  it("keeps a statistics link to http/https", () => {
    expect(sql).toContain(
      `CHECK ("statsUrl" IS NULL OR "statsUrl" ~* '^https?://')`
    );
  });

  it("allows exactly CHALLENGE_RATINGS, so the code and the CHECK cannot drift", () => {
    const list = /"challengeRating" IN \(([^)]*)\)/.exec(sql)?.[1];
    expect(list).toBeDefined();
    const allowed = [...(list ?? "").matchAll(/'([^']*)'/g)].map((m) => m[1]);
    expect(allowed).toEqual([...CHALLENGE_RATINGS]);
  });
});
