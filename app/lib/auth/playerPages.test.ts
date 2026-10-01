import { describe, expect, it } from "vitest";

import { isPlayerPath } from "./playerPages";

describe("isPlayerPath (SPEC-022 T7)", () => {
  it.each([
    "/dashboard/dnd5e",
    "/dashboard/dnd5e/",
    "/dashboard/daggerheart/geography",
    "/dashboard/dnd5e/spells",
    "/dashboard/daggerheart/classes/3",
    "/dashboard/daggerheart/subclasses/4",
    "/dashboard/daggerheart/domains/1",
    "/dashboard/daggerheart/domain-cards",
  ])("lets a player through to %s", (path) => {
    expect(isPlayerPath(path)).toBe(true);
  });

  it.each([
    "/dashboard/dnd5e/npc",
    "/dashboard/dnd5e/admin/npc",
    "/dashboard/dnd5e/campaign",
    "/dashboard/dnd5e/geographyx",
    "/dashboard/dnd5e/admin/geography",
    "/dashboard/dnd5e/world",
    "/dashboard/dnd5e/treasures",
    "/dashboard/dnd5e/admin/spells",
  ])("refuses a player %s", (path) => {
    expect(isPlayerPath(path)).toBe(false);
  });
});
