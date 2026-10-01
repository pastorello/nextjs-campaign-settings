import { describe, expect, it } from "vitest";

import adversaryShapeErrors from "./adversaryShapeErrors";

const standard = {
  adversaryType: "standard",
  hordeDensity: null,
  majorThreshold: 7,
  severeThreshold: 12,
};

describe("adversaryShapeErrors (SPEC-028 §5, §9 decision 1)", () => {
  it("accepts a standard adversary with both thresholds in order", () => {
    expect(adversaryShapeErrors(standard)).toBeNull();
  });

  it("asks a horde for its density, and refuses one on any other type", () => {
    expect(
      adversaryShapeErrors({ ...standard, adversaryType: "horde" })
    ).toEqual({ hordeDensity: [{ key: "hordeNeedsDensity" }] });
    expect(
      adversaryShapeErrors({
        ...standard,
        adversaryType: "horde",
        hordeDensity: 3,
      })
    ).toBeNull();
    expect(adversaryShapeErrors({ ...standard, hordeDensity: 3 })).toEqual({
      hordeDensity: [{ key: "densityOnlyForHorde" }],
    });
  });

  it("lets only a minion go without thresholds", () => {
    const none = { majorThreshold: null, severeThreshold: null };
    expect(
      adversaryShapeErrors({ ...standard, ...none, adversaryType: "minion" })
    ).toBeNull();
    expect(adversaryShapeErrors({ ...standard, ...none })).toEqual({
      majorThreshold: [{ key: "thresholdsRequired" }],
    });
  });

  it("wants the thresholds as a pair, even on a minion", () => {
    const minion = { ...standard, adversaryType: "minion" };
    expect(adversaryShapeErrors({ ...minion, majorThreshold: null })).toEqual({
      majorThreshold: [{ key: "thresholdsPair" }],
    });
    expect(adversaryShapeErrors({ ...minion, severeThreshold: null })).toEqual({
      severeThreshold: [{ key: "thresholdsPair" }],
    });
  });

  it("refuses Major at or above Severe, on Severe", () => {
    expect(adversaryShapeErrors({ ...standard, majorThreshold: 12 })).toEqual({
      severeThreshold: [{ key: "majorBelowSevere" }],
    });
  });
});
