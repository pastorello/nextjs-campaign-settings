import { describe, expect, it } from "vitest";

import { toDisplayAmount, toStoredSilver } from "./convertCurrency";

describe("convertCurrency (SPEC-013 T5)", () => {
  it("passes a silver amount through unchanged in both directions", () => {
    expect(toDisplayAmount(85, "silver")).toBe(85);
    expect(toStoredSilver(85, "silver")).toBe(85);
  });

  it("converts stored silver to a displayed gold amount at 10:1", () => {
    expect(toDisplayAmount(80, "gold")).toBe(8);
  });

  it("converts a gold amount entered by the DM back to stored silver", () => {
    expect(toStoredSilver(8, "gold")).toBe(80);
  });

  it("round-trips a gold-displayed amount through both conversions", () => {
    const stored = 240;
    const displayed = toDisplayAmount(stored, "gold");
    expect(toStoredSilver(displayed, "gold")).toBe(stored);
  });
});
