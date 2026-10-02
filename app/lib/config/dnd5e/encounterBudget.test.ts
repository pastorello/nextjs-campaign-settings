import { describe, expect, it } from "vitest";

import { CHALLENGE_RATINGS } from "./challengeRatings";
import {
  XP_BUDGET_PER_CHARACTER,
  XP_BY_CHALLENGE_RATING,
} from "./encounterBudget";

// The values are SRD 5.2.1's, checked against `5e-encounters.md` §1; this
// suite pins the shape and a sample, not every cell twice.
describe("XP_BY_CHALLENGE_RATING (SPEC-031)", () => {
  it("prices every challenge rating, in rising order", () => {
    // A Record's integer-like keys enumerate first, so compare as sets.
    expect(new Set(Object.keys(XP_BY_CHALLENGE_RATING))).toEqual(
      new Set(CHALLENGE_RATINGS)
    );
    const priced = CHALLENGE_RATINGS.slice(1).map(
      (rating) => XP_BY_CHALLENGE_RATING[rating] ?? 0
    );
    expect(priced).toEqual([...priced].sort((a, b) => a - b));
  });

  it("leaves CR 0 to the DM: the SRD says 0 or 10", () => {
    expect(XP_BY_CHALLENGE_RATING["0"]).toBeNull();
  });

  it.each([
    ["1/8", 25],
    ["1/2", 100],
    ["1", 200],
    ["4", 1_100],
    ["13", 10_000],
    ["20", 25_000],
    ["21", 33_000],
    ["30", 155_000],
  ] as const)("CR %s is worth %i XP", (rating, xp) => {
    expect(XP_BY_CHALLENGE_RATING[rating]).toBe(xp);
  });
});

describe("XP_BUDGET_PER_CHARACTER (SPEC-031)", () => {
  it("covers levels 1–20, each grade above the last", () => {
    expect(XP_BUDGET_PER_CHARACTER).toHaveLength(20);
    for (const { low, moderate, high } of XP_BUDGET_PER_CHARACTER) {
      expect(low).toBeLessThan(moderate);
      expect(moderate).toBeLessThan(high);
    }
  });

  it.each([
    [1, { low: 50, moderate: 75, high: 100 }],
    [5, { low: 500, moderate: 750, high: 1_100 }],
    [15, { low: 3_300, moderate: 5_400, high: 7_800 }],
    [20, { low: 6_400, moderate: 13_200, high: 22_000 }],
  ] as const)("level %i", (level, budget) => {
    expect(XP_BUDGET_PER_CHARACTER[level - 1]).toEqual(budget);
  });
});
