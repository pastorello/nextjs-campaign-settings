import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SPEC-014 T2 — same harness situation spec013CampaignSchema.test.ts
// documents: no DB-backed unit tier exists, so these tests assert against the
// migration SQL, the artifact that actually runs. Its top half is exactly what
// `prisma migrate diff --from-schema <main's schema> --to-schema
// prisma/schema.prisma --script` printed; the bottom half (guards and seeded
// rows) is hand-written. Both were verified once, by hand, against a
// throwaway Postgres: `migrate deploy` applied the whole chain clean, every
// guard below rejected its bad row, and `migrate diff` from that database to
// the schema was empty — Prisma ignores the partial indexes and CHECKs rather
// than proposing to drop them. CI's e2e job applies the chain with `migrate
// deploy` on every run.

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const migrationFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_spec014_calendar_schema")
);

if (!migrationFolder) {
  throw new Error(
    "SPEC-014 T2 migration folder (*_spec014_calendar_schema) not found under prisma/migrations"
  );
}

const sql = readFileSync(
  path.join(migrationsDir, migrationFolder, "migration.sql"),
  "utf-8"
);

/** The body of the one `INSERT INTO "<table>"` statement, up to its `;`. */
function insertInto(table: string): string {
  const matches = [
    ...sql.matchAll(new RegExp(`INSERT INTO "${table}"[^;]*;`, "g")),
  ];
  expect(matches, `exactly one INSERT INTO "${table}"`).toHaveLength(1);
  return matches[0]?.[0] ?? "";
}

describe("SPEC-014 T2 — calendar schema migration", () => {
  it("is purely additive: new tables and one new column, nothing dropped or rewritten", () => {
    for (const table of [
      "dateSystem",
      "calendarSettings",
      "calendarEvent",
      "_calendarEventTozone",
      "_calendarEventTonpc",
      "_calendarEventTodeities",
      "_calendarEventTofaction",
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE "${table}" `));
    }
    expect(sql).toMatch(
      /ALTER TABLE "campaign" ADD COLUMN\s+"currentDay" INTEGER;/
    );

    expect(sql).not.toMatch(/DROP /i);
    // Not a bare /UPDATE / or /DELETE /: every FK says `ON DELETE ... ON
    // UPDATE CASCADE`.
    expect(sql).not.toMatch(/UPDATE "\w+" SET/i);
    expect(sql).not.toMatch(/DELETE FROM/i);
    expect(sql).not.toMatch(/ALTER COLUMN/i);
    // The only existing table altered is `campaign`, by the ADD COLUMN above;
    // `adventure.timeline` is T8's migration, not this one (§6).
    const altered = new Set(
      [...sql.matchAll(/ALTER TABLE "(\w+)"/g)].map((m) => m[1])
    );
    expect(altered).toEqual(
      new Set([
        "campaign",
        "dateSystem",
        "calendarSettings",
        "calendarEvent",
        "_calendarEventTozone",
        "_calendarEventTonpc",
        "_calendarEventTodeities",
        "_calendarEventTofaction",
      ])
    );
    expect(sql).not.toMatch(/"timeline"/);
  });

  it("deletes the way §5's edge cases say", () => {
    // A campaign takes its events with it; a deleted adventure or scene
    // clears the link and leaves the event; a deleted place, NPC, deity or
    // faction removes only its join row.
    const expectedOnDelete: Record<string, string> = {
      calendarEvent_campaignId_fkey: "CASCADE",
      calendarEvent_adventureId_fkey: "SET NULL",
      calendarEvent_sceneId_fkey: "SET NULL",
      _calendarEventTozone_B_fkey: "CASCADE",
      _calendarEventTonpc_B_fkey: "CASCADE",
      _calendarEventTodeities_B_fkey: "CASCADE",
      _calendarEventTofaction_B_fkey: "CASCADE",
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

  it("creates §6's indexes", () => {
    expect(sql).toMatch(
      /CREATE INDEX "calendarEvent_campaignId_startDay_idx" ON "calendarEvent"\("campaignId", "startDay"\);/
    );
    expect(sql).toMatch(
      /CREATE INDEX "calendarEvent_startDay_idx" ON "calendarEvent"\("startDay"\);/
    );
  });

  it("guards one universal count and one default at the database", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "dateSystem_one_universal" ON "dateSystem"\("isUniversal"\) WHERE "isUniversal";/
    );
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "dateSystem_one_default" ON "dateSystem"\("isDefault"\) WHERE "isDefault";/
    );
  });

  it("checks name counts, the singleton, days and hours", () => {
    const checks: Record<string, string> = {
      dateSystem_monthNames_count: `"monthNames" IS NOT NULL AND cardinality("monthNames") = 12`,
      dateSystem_weekdayNames_count: `"weekdayNames" IS NOT NULL AND cardinality("weekdayNames") = 7`,
      calendarSettings_singleton: `"id" = 1`,
      calendarEvent_startDay_nonnegative: `"startDay" >= 0`,
      calendarEvent_endDay_not_before_start: `"endDay" >= "startDay"`,
      calendarEvent_startHour_range: `"startHour" BETWEEN 0 AND 23`,
      calendarEvent_endHour_range: `"endHour" BETWEEN 0 AND 23`,
    };

    for (const [constraint, condition] of Object.entries(checks)) {
      expect(sql, constraint).toContain(
        `ADD CONSTRAINT "${constraint}" CHECK (${condition});`
      );
    }
  });

  it("seeds the universal count as the default, with 12 months and 7 weekdays", () => {
    const insert = insertInto("dateSystem");
    // Columns and values in order: isUniversal, isDefault, name, anchorEvent,
    // anchorYear — the universal count is anchored at year 0 and has no
    // anchor event.
    expect(insert).toMatch(
      /\("isUniversal", "isDefault", "name", "anchorEvent", "anchorYear",/
    );
    expect(insert).toMatch(
      /VALUES \(\s*true,\s*true,\s*'Calendario universale',\s*NULL,\s*0,/
    );

    const arrays = [...insert.matchAll(/ARRAY\[([^\]]*)\]/g)].map((m) =>
      (m[1] ?? "").split(",").map((name) => name.trim())
    );
    expect(arrays).toHaveLength(2);
    const [months = [], weekdays = []] = arrays;
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("'Gennaio'");
    expect(months[11]).toBe("'Dicembre'");
    expect(weekdays).toHaveLength(7);
    expect(weekdays[0]).toBe("'Lunedì'");
    expect(weekdays[6]).toBe("'Domenica'");
  });

  it("seeds the settings singleton with no reference new moon", () => {
    expect(insertInto("calendarSettings")).toMatch(
      /\("id", "moonNewMoonDay"\) VALUES \(1, NULL\);/
    );
  });
});
