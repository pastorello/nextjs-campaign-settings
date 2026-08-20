import { describe, expect, it } from "vitest";

import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import gridScales from "./grid-scales";

/**
 * SPEC-015 §6 — the four scales as the DM specified them, in metres so no
 * display code ever multiplies units. The metric figures are the campaign's
 * own (the imperial equivalents live in docs/domain/, not here).
 */
describe("grid scale options", () => {
  it("declares exactly one option per GridScale member", () => {
    expect(gridScales.map((s) => s.value).sort()).toEqual(
      Object.values(GridScale).sort()
    );
  });

  it.each([
    [GridScale.Dungeon, 1.5],
    [GridScale.Province, 1_500],
    [GridScale.Kingdom, 9_000],
    [GridScale.Continent, 90_000],
  ])("one %s square is %d metres", (scale, meters) => {
    const option = gridScales.find((s) => s.value === scale);
    expect(option?.metersPerSquare).toBe(meters);
  });

  it("every option carries a geography.gridScales.* label key", () => {
    for (const option of gridScales) {
      expect(option.labelKey).toMatch(/^geography\.gridScales\.[a-z]+$/);
    }
  });
});
