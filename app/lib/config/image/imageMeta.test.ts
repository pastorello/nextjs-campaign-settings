import { describe, expect, it } from "vitest";

import imageMeta from "./imageMeta";

describe("imageMeta (SPEC-020 T3)", () => {
  it("accepts a positive integer id, null and an absent value", () => {
    expect(imageMeta.validator.safeParse(7).success).toBe(true);
    expect(imageMeta.validator.safeParse(null).success).toBe(true);
    expect(imageMeta.validator.safeParse(undefined).success).toBe(true);
  });

  it.each([0, -3, 1.5, "7"])("refuses %p with imageNotFound", (value) => {
    const result = imageMeta.validator.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("imageNotFound");
  });

  it("renders the bare id: cards read the keys from the row instead", () => {
    expect(imageMeta.getDatum(7)).toBe(7);
    expect(imageMeta.getDatum(null)).toBeNull();
  });
});
