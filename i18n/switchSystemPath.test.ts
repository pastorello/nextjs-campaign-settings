import { describe, expect, it } from "vitest";

import type GameSystem from "@/app/lib/definitions/GameSystem";

import { switchSystemPath } from "./switchSystemPath";

// `GAME_SYSTEMS` holds only `dnd5e` until a second system lands with its first
// slice (ADR-0013 rule 1), so the target of a real switch is not yet a member
// of the type. The helper only reads the slug, so the assertion is safe.
const daggerheart = "daggerheart" as GameSystem;

describe("switchSystemPath (ADR-0013 rule 6)", () => {
  it("keeps a shared page's path and query under the target system", () => {
    expect(
      switchSystemPath("/dashboard/dnd5e/geography", "place=12", daggerheart)
    ).toBe("/dashboard/daggerheart/geography?place=12");
  });

  it("keeps nested shared paths, including admin pages", () => {
    expect(switchSystemPath("/dashboard/dnd5e/npc/7", "", daggerheart)).toBe(
      "/dashboard/daggerheart/npc/7"
    );
    expect(
      switchSystemPath("/dashboard/dnd5e/admin/deities/new", "", daggerheart)
    ).toBe("/dashboard/daggerheart/admin/deities/new");
  });

  it("maps the overview to the target's overview", () => {
    expect(switchSystemPath("/dashboard/dnd5e", "", daggerheart)).toBe(
      "/dashboard/daggerheart"
    );
  });

  it("sends a catalogue page to the target's overview, dropping the query", () => {
    expect(
      switchSystemPath("/dashboard/dnd5e/spells", "level=3", daggerheart)
    ).toBe("/dashboard/daggerheart");
    expect(
      switchSystemPath("/dashboard/dnd5e/magicitems/4/edit", "", daggerheart)
    ).toBe("/dashboard/daggerheart");
    expect(
      switchSystemPath("/dashboard/dnd5e/admin/treasures/new", "", daggerheart)
    ).toBe("/dashboard/daggerheart");
  });

  it("keeps a catalogue page when the target is its own system", () => {
    expect(
      switchSystemPath("/dashboard/dnd5e/spells", "level=3", "dnd5e")
    ).toBe("/dashboard/dnd5e/spells?level=3");
  });

  it("falls back to the target's overview outside the dashboard", () => {
    expect(switchSystemPath("/", "", daggerheart)).toBe(
      "/dashboard/daggerheart"
    );
  });
});
