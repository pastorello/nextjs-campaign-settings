import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-021 T1 — same harness situation spec014CalendarSchema.test.ts
// documents: no DB-backed unit tier exists, so these tests assert against the
// migration SQL, the artifact that actually runs. Its top part is exactly what
// `prisma migrate diff --from-schema <main's schema> --to-schema
// prisma/schema.prisma --script` printed; the CHECKs at the end are
// hand-written. CI's e2e job applies the chain with `migrate deploy` on every
// run, which is where a CHECK with bad SQL would fail.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec021_daggerheart_schema")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-021 T1 migration folder (*_spec021_daggerheart_schema) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

const TABLES = [
  "dhDomain",
  "dhDomainCard",
  "dhClass",
  "dhClassFeature",
  "dhSubclass",
  "dhSubclassFeature",
];

/** The column list of one `CREATE TABLE "<table>" (...)`. */
function table(name: string): string {
  const body = new RegExp(`CREATE TABLE "${name}" \\(([^;]*)\\);`).exec(
    sql
  )?.[1];
  expect(body, `CREATE TABLE "${name}"`).toBeDefined();
  return body ?? "";
}

function foreignKey(
  owner: string,
  column: string,
  target: string,
  onDelete: string
): RegExp {
  return new RegExp(
    `ALTER TABLE "${owner}" ADD CONSTRAINT "${owner}_${column}_fkey" FOREIGN KEY \\("${column}"\\) REFERENCES "${target}"\\("id"\\) ON DELETE ${onDelete} `
  );
}

describe("SPEC-021 T1 — Daggerheart schema migration", () => {
  it("is purely additive: six new tables, no existing table touched", () => {
    const created = [...sql.matchAll(/CREATE TABLE "(\w+)"/g)].map((m) => m[1]);
    expect(new Set(created)).toEqual(new Set(TABLES));

    // Every ALTER TABLE is on a new table (FKs and CHECKs), never an old one.
    const altered = new Set(
      [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1])
    );
    for (const name of altered) expect(TABLES).toContain(name);

    expect(sql).not.toMatch(/DROP /i);
    expect(sql).not.toMatch(/UPDATE "\w+" SET/i);
    expect(sql).not.toMatch(/DELETE FROM/i);
    expect(sql).not.toMatch(/ALTER COLUMN/i);
    expect(sql).not.toMatch(/ADD COLUMN/i);
    // Nothing is seeded (SPEC-018 §5: the repo holds no rules content).
    expect(sql).not.toMatch(/INSERT INTO/i);
  });

  it("uses English column names and timestamps on the four catalogues", () => {
    expect(table("dhDomainCard")).toMatch(/"recallCost" INTEGER NOT NULL/);
    expect(table("dhDomainCard")).toMatch(/"featureText" TEXT NOT NULL/);
    expect(table("dhClass")).toMatch(/"startingEvasion" INTEGER NOT NULL/);
    expect(table("dhClass")).toMatch(/"hopeFeatureName" TEXT NOT NULL/);
    expect(table("dhSubclass")).toMatch(/"spellcastTrait" TEXT,/);
    expect(table("dhSubclassFeature")).toMatch(/"tier" TEXT NOT NULL/);

    for (const name of ["dhDomain", "dhDomainCard", "dhClass", "dhSubclass"]) {
      expect(table(name)).toMatch(/"origin" TEXT NOT NULL DEFAULT 'homebrew'/);
      expect(table(name)).toMatch(
        /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/
      );
      expect(table(name)).toMatch(/"updatedAt" TIMESTAMP\(3\) NOT NULL/);
    }
    // The Hope feature's cost is always 3 Hope, so it is not stored.
    expect(table("dhClass")).not.toMatch(/Cost/i);
  });

  it("gives a domain an emblem the SPEC-020 way: a nullable, unique imageId that nulls on image delete", () => {
    expect(table("dhDomain")).toMatch(/"imageId" INTEGER,/);
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "dhDomain_imageId_key" ON "dhDomain"("imageId");'
    );
    expect(sql).toMatch(
      foreignKey("dhDomain", "imageId", "recordImage", "SET NULL")
    );
  });

  it("refuses deleting a domain or class still in use, and cascades features with their owner", () => {
    expect(sql).toMatch(
      foreignKey("dhDomainCard", "domainId", "dhDomain", "RESTRICT")
    );
    expect(sql).toMatch(
      foreignKey("dhClass", "domainAId", "dhDomain", "RESTRICT")
    );
    expect(sql).toMatch(
      foreignKey("dhClass", "domainBId", "dhDomain", "RESTRICT")
    );
    expect(sql).toMatch(
      foreignKey("dhSubclass", "classId", "dhClass", "RESTRICT")
    );
    // ADR-0018: one feature table per owner, each with a real FK.
    expect(sql).toMatch(
      foreignKey("dhClassFeature", "classId", "dhClass", "CASCADE")
    );
    expect(sql).toMatch(
      foreignKey("dhSubclassFeature", "subclassId", "dhSubclass", "CASCADE")
    );
  });

  it("guards level 1–10, a non-negative recall cost and two distinct domains", () => {
    expect(sql).toContain(
      'ALTER TABLE "dhDomainCard" ADD CONSTRAINT "dhDomainCard_level_range" CHECK ("level" BETWEEN 1 AND 10);'
    );
    expect(sql).toContain(
      'ALTER TABLE "dhDomainCard" ADD CONSTRAINT "dhDomainCard_recallCost_nonnegative" CHECK ("recallCost" >= 0);'
    );
    expect(sql).toContain(
      'ALTER TABLE "dhClass" ADD CONSTRAINT "dhClass_distinct_domains" CHECK ("domainAId" <> "domainBId");'
    );
  });

  it("indexes the lookups the pages make: cards by domain and level, the FK columns", () => {
    expect(sql).toContain(
      'CREATE INDEX "dhDomainCard_domainId_level_idx" ON "dhDomainCard"("domainId", "level");'
    );
    for (const [owner, column] of [
      ["dhClass", "domainAId"],
      ["dhClass", "domainBId"],
      ["dhClassFeature", "classId"],
      ["dhSubclass", "classId"],
      ["dhSubclassFeature", "subclassId"],
    ]) {
      expect(sql).toContain(
        `CREATE INDEX "${owner}_${column}_idx" ON "${owner}"("${column}");`
      );
    }
  });
});
