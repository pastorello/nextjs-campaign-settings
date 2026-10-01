import { describe, expect, it } from "vitest";

import tierOfLevel from "./tierOfLevel";

describe("tierOfLevel (daggerheart.md §3)", () => {
  it.each([
    [1, 1],
    [2, 2],
    [4, 2],
    [5, 3],
    [7, 3],
    [8, 4],
    [10, 4],
    [0, 1],
    [12, 4],
  ])("level %i is tier %i", (level, tier) => {
    expect(tierOfLevel(level)).toBe(tier);
  });
});
