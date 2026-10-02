import { describe, expect, it } from "vitest";

import encounterDifficulty from "./encounterDifficulty";

describe("encounterDifficulty (SPEC-031 §5.B)", () => {
  it("sums XP each × quantity over the rows", () => {
    const result = encounterDifficulty(
      [
        { xpEach: 450, quantity: 2 },
        { xpEach: 25, quantity: 9 },
      ],
      5,
      3
    );
    expect(result.xp).toBe(1_125);
  });

  it("builds the budgets from the level's row times the party size", () => {
    // 5e-encounters.md §2: level 3 is 150 / 225 / 400 per character.
    expect(encounterDifficulty([], 5, 3).budgets).toEqual({
      low: 750,
      moderate: 1_125,
      high: 2_000,
    });
    // Level 15, six characters: 3,300 / 5,400 / 7,800 each.
    expect(encounterDifficulty([], 6, 15).budgets).toEqual({
      low: 19_800,
      moderate: 32_400,
      high: 46_800,
    });
  });

  it.each([
    [200, "low"],
    [600, "low"],
    [601, "moderate"],
    [900, "moderate"],
    [901, "high"],
    [1_600, "high"],
    [1_601, "aboveHigh"],
  ] as const)("puts %i XP for four level-3 characters in %s", (xp, band) => {
    expect(encounterDifficulty([{ xpEach: xp, quantity: 1 }], 4, 3).band).toBe(
      band
    );
  });

  it("counts rows with no XP apart, not as zero", () => {
    const result = encounterDifficulty(
      [
        { xpEach: null, quantity: 3 },
        { xpEach: 200, quantity: 1 },
        { xpEach: null, quantity: 1 },
      ],
      4,
      1
    );
    expect(result).toMatchObject({ xp: 200, unpriced: 2, band: "low" });
  });

  it("shows the budgets and no band for a fight with nothing priced", () => {
    expect(encounterDifficulty([], 4, 1)).toEqual({
      xp: 0,
      unpriced: 0,
      budgets: { low: 200, moderate: 300, high: 400 },
      band: null,
    });
    expect(
      encounterDifficulty([{ xpEach: null, quantity: 2 }], 4, 1).band
    ).toBeNull();
  });

  it("clamps the target level to 1–20", () => {
    expect(encounterDifficulty([], 1, 0).budgets.low).toBe(50);
    expect(encounterDifficulty([], 1, -3).budgets.low).toBe(50);
    expect(encounterDifficulty([], 1, 25).budgets.high).toBe(22_000);
    expect(encounterDifficulty([], 1, Number.NaN).budgets.low).toBe(50);
  });

  it("reads a party of fewer than one as one character", () => {
    expect(encounterDifficulty([], 0, 1).budgets.low).toBe(50);
  });
});
