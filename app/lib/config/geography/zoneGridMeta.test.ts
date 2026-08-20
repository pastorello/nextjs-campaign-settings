import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import zoneGridMeta, { GRID_COLUMNS_MAX } from "./zoneGridMeta";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";

describePageMetaInvariants("zoneGridMeta", zoneGridMeta);

describe("zoneGridMeta (SPEC-015 T4)", () => {
  it("rejects a zero width — a grid of zero squares is not a grid", () => {
    expect(zoneGridMeta.gridColumns.validator.safeParse(0).success).toBe(false);
  });

  it("rejects a negative width", () => {
    expect(zoneGridMeta.gridColumns.validator.safeParse(-3).success).toBe(
      false
    );
  });

  it("rejects an absent width", () => {
    expect(
      zoneGridMeta.gridColumns.validator.safeParse(undefined).success
    ).toBe(false);
  });

  it("rejects a fractional width", () => {
    expect(zoneGridMeta.gridColumns.validator.safeParse(12.5).success).toBe(
      false
    );
  });

  it("accepts the cap itself but rejects one past it", () => {
    expect(
      zoneGridMeta.gridColumns.validator.safeParse(GRID_COLUMNS_MAX).success
    ).toBe(true);
    expect(
      zoneGridMeta.gridColumns.validator.safeParse(GRID_COLUMNS_MAX + 1).success
    ).toBe(false);
  });

  it("accepts the spec's own example width", () => {
    const parsed = zoneGridMeta.gridColumns.validator.safeParse(36);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBe(36);
  });

  it("coerces the string a text control submits", () => {
    const parsed = zoneGridMeta.gridColumns.validator.safeParse("36");
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBe(36);
  });

  it("accepts every declared scale", () => {
    Object.values(GridScale).forEach((scale) => {
      expect(zoneGridMeta.gridScale.validator.safeParse(scale).success).toBe(
        true
      );
    });
  });

  it("rejects a scale outside the four", () => {
    expect(zoneGridMeta.gridScale.validator.safeParse("hex").success).toBe(
      false
    );
  });
});
