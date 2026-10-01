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
    "/dashboard/dnd5e/npc",
    "/dashboard/dnd5e/search",
    "/dashboard/dnd5e/deities",
    "/dashboard/dnd5e/magicitems",
    "/dashboard/daggerheart/factions",
    // SPEC-029 §9 decision 1.
    "/dashboard/daggerheart/weapons",
    "/dashboard/daggerheart/armor",
  ])("lets a player through to %s", (path) => {
    expect(isPlayerPath(path)).toBe(true);
  });

  it.each([
    "/dashboard/dnd5e/admin/npc",
    "/dashboard/dnd5e/campaign",
    "/dashboard/dnd5e/geographyx",
    "/dashboard/dnd5e/admin/geography",
    "/dashboard/dnd5e/world",
    "/dashboard/dnd5e/treasures",
    "/dashboard/dnd5e/admin/spells",
    // SPEC-028 §9 decision 3: the GM-side stat blocks.
    "/dashboard/daggerheart/adversaries",
    "/dashboard/daggerheart/environments",
    "/dashboard/daggerheart/loot",
  ])("refuses a player %s", (path) => {
    expect(isPlayerPath(path)).toBe(false);
  });
});
