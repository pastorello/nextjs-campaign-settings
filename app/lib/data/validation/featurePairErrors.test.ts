import { describe, expect, it } from "vitest";

import featurePairErrors, { blankToNull } from "./featurePairErrors";

const keys = { name: "weaponFeatureName", text: "weaponFeatureText" };

describe("featurePairErrors (SPEC-029 §6)", () => {
  it("accepts a whole feature, or none", () => {
    expect(featurePairErrors("Keen", "<p>Cuts.</p>", keys)).toBeNull();
    expect(featurePairErrors(null, null, keys)).toBeNull();
  });

  it("refuses half a feature, on the missing half", () => {
    expect(featurePairErrors("Keen", null, keys)).toEqual({
      weaponFeatureText: [{ key: "featureNeedsBoth" }],
    });
    expect(featurePairErrors(null, "<p>Cuts.</p>", keys)).toEqual({
      weaponFeatureName: [{ key: "featureNeedsBoth" }],
    });
  });
});

describe("blankToNull", () => {
  it("stores a blank as null and leaves a missing key missing", () => {
    expect(blankToNull("")).toBeNull();
    expect(blankToNull("  ")).toBeNull();
    expect(blankToNull(null)).toBeNull();
    expect(blankToNull(undefined)).toBeUndefined();
    expect(blankToNull("Keen")).toBe("Keen");
  });
});
