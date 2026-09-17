import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_SYSTEM, GAME_SYSTEMS, isGameSystem } from "./GameSystem";

describe("GameSystem", () => {
  it("accepts every declared system", () => {
    for (const system of GAME_SYSTEMS) expect(isGameSystem(system)).toBe(true);
  });

  it.each(["", "DND5E", "daggerheart", "spells", undefined, 5])(
    "rejects %s",
    (value) => {
      expect(isGameSystem(value)).toBe(false);
    }
  );

  it("defaults to a declared system", () => {
    expect(isGameSystem(DEFAULT_GAME_SYSTEM)).toBe(true);
  });
});
