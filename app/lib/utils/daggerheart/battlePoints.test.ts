import { describe, expect, it } from "vitest";

import DhBattleAdjustment from "@/app/lib/definitions/enums/daggerheart/DhBattleAdjustment";
import {
  battlePointBudget,
  rowBattlePoints,
  sceneBattlePoints,
  suggestsLowerTier,
} from "./battlePoints";

const row = (adversaryType: string | null, quantity: number, tier = 1) => ({
  quantity,
  dhAdversary: adversaryType === null ? null : { adversaryType, tier },
});

describe("rowBattlePoints (SPEC-030 T3)", () => {
  it("costs a row its type's points times its quantity", () => {
    expect(rowBattlePoints(row("standard", 3), 4)).toBe(6);
    expect(rowBattlePoints(row("solo", 1), 4)).toBe(5);
    expect(rowBattlePoints(row("bruiser", 2), 4)).toBe(8);
  });

  it("costs a Minion row once per party-sized group, rounded up", () => {
    expect(rowBattlePoints(row("minion", 4), 4)).toBe(1);
    expect(rowBattlePoints(row("minion", 5), 4)).toBe(2);
    expect(rowBattlePoints(row("minion", 1), 4)).toBe(1);
  });

  it("leaves a row without an adversary unpriced", () => {
    expect(rowBattlePoints(row(null, 2), 4)).toBeNull();
    expect(rowBattlePoints({ quantity: 2 }, 4)).toBeNull();
  });

  it("leaves a type outside the vocabulary unpriced, not free", () => {
    expect(rowBattlePoints(row("dragon", 1), 4)).toBeNull();
  });
});

describe("battlePointBudget (SPEC-030 T3)", () => {
  it("is 3 × the party size + 2 with nothing ticked", () => {
    expect(battlePointBudget(4, [])).toBe(14);
    expect(battlePointBudget(3, [])).toBe(11);
  });

  it("adds the ticked adjustments, each once", () => {
    expect(
      battlePointBudget(4, [
        DhBattleAdjustment.HarderOrLonger,
        DhBattleAdjustment.TwoOrMoreSolos,
        DhBattleAdjustment.HarderOrLonger,
      ])
    ).toBe(14);
    expect(battlePointBudget(4, [DhBattleAdjustment.LowerTierAdversary])).toBe(
      15
    );
  });

  it("ignores a stored key outside the adjustment list", () => {
    expect(battlePointBudget(4, ["retired", "harderOrLonger"])).toBe(16);
  });
});

describe("sceneBattlePoints (SPEC-030 T3)", () => {
  it("sums the priced rows and counts the unpriced ones", () => {
    expect(
      sceneBattlePoints([row("leader", 1), row("minion", 6), row(null, 3)], 4)
    ).toEqual({ spent: 5, unpriced: 1 });
  });
});

describe("suggestsLowerTier (SPEC-030 T3)", () => {
  it("suggests the +1 when an adversary sits below the adventure's tier", () => {
    expect(suggestsLowerTier([row("standard", 1, 1)], 2, [])).toBe(true);
  });

  it("does not suggest it at or above the tier, or once ticked", () => {
    expect(suggestsLowerTier([row("standard", 1, 2)], 2, [])).toBe(false);
    expect(suggestsLowerTier([row(null, 1)], 2, [])).toBe(false);
    expect(
      suggestsLowerTier([row("standard", 1, 1)], 2, [
        DhBattleAdjustment.LowerTierAdversary,
      ])
    ).toBe(false);
  });
});
