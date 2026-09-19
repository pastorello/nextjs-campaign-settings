import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_SYSTEM, GAME_SYSTEMS, isGameSystem } from "./GameSystem";

describe("GameSystem", () => {
  it("accepts every declared system", () => {
    for (const system of GAME_SYSTEMS) expect(isGameSystem(system)).toBe(true);
  });

  it("holds 5e and, since SPEC-021 T1, Daggerheart", () => {
    expect(GAME_SYSTEMS).toEqual(["dnd5e", "daggerheart"]);
  });

  // `pf2e` is named by ADR-0013 but joins only with its first slice.
  it.each(["", "DND5E", "Daggerheart", "pf2e", "spells", undefined, 5])(
    "rejects %s",
    (value) => {
      expect(isGameSystem(value)).toBe(false);
    }
  );

  it("defaults to a declared system", () => {
    expect(isGameSystem(DEFAULT_GAME_SYSTEM)).toBe(true);
  });
});
