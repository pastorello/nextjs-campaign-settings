import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-020 T2 — same harness situation spec014CalendarSchema.test.ts
// documents: no DB-backed unit tier exists, so these tests assert against the
// migration SQL, the artifact that actually runs. Below its header comment
// the file is exactly what `prisma migrate diff --from-schema <main's schema>
// --to-schema prisma/schema.prisma --script` printed. CI's e2e job applies
// the chain with `migrate deploy` on every run.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec020_record_images")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-020 T2 migration folder (*_spec020_record_images) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

// SPEC-021's Daggerheart domain table gained the same column in its own
// migration, checked by spec021DaggerheartSchema.test.ts.
const OWNERS = ["deities", "magicitems", "npc", "faction", "zone", "treasure"];

describe("SPEC-020 T2 — record image schema migration", () => {
  it("is purely additive: one new table and one nullable column per owner", () => {
    expect(sql).toMatch(/CREATE TABLE "recordImage" \(/);
    for (const owner of OWNERS) {
      expect(sql).toMatch(
        new RegExp(`ALTER TABLE "${owner}" ADD COLUMN\\s+"imageId" INTEGER;`)
      );
    }

    expect(sql).not.toMatch(/DROP /i);
    expect(sql).not.toMatch(/UPDATE "\w+" SET/i);
    expect(sql).not.toMatch(/DELETE FROM/i);
    expect(sql).not.toMatch(/ALTER COLUMN/i);
    expect(sql).not.toMatch(/INSERT INTO/i);
    // Nullable: no existing row has an image, so NOT NULL would fail.
    expect(sql).not.toMatch(/"imageId" INTEGER NOT NULL/);

    const altered = new Set(
      [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1])
    );
    expect(altered).toEqual(new Set(OWNERS));
  });

  it("holds §6's columns on recordImage", () => {
    const table = /CREATE TABLE "recordImage" \(([^;]*)\);/.exec(sql)?.[1];
    expect(table).toBeDefined();
    for (const column of [
      /"id" SERIAL NOT NULL/,
      /"displayKey" TEXT NOT NULL/,
      /"thumbKey" TEXT NOT NULL/,
      /"mimeType" TEXT NOT NULL/,
      /"width" INTEGER NOT NULL/,
      /"height" INTEGER NOT NULL/,
      /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/,
    ]) {
      expect(table).toMatch(column);
    }
  });

  it("makes each reference unique — one image per record, one record per image", () => {
    for (const owner of OWNERS) {
      expect(sql).toContain(
        `CREATE UNIQUE INDEX "${owner}_imageId_key" ON "${owner}"("imageId");`
      );
    }
  });

  it("nulls the reference when the image row is deleted, never deleting the record", () => {
    for (const owner of OWNERS) {
      expect(sql).toMatch(
        new RegExp(
          `CONSTRAINT "${owner}_imageId_fkey" FOREIGN KEY \\("imageId"\\) REFERENCES "recordImage"\\("id"\\) ON DELETE SET NULL`
        )
      );
    }
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
  });
});
