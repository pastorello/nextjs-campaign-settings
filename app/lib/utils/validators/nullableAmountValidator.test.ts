import { describe, expect, it } from "vitest";

import nullableAmountValidator from "./nullableAmountValidator";

describe("nullableAmountValidator (TD-130)", () => {
  const validator = nullableAmountValidator();

  it("turns a blank string into null rather than 0", () => {
    const result = validator.safeParse("");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it("turns undefined into null", () => {
    const result = validator.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it("passes null through unchanged", () => {
    const result = validator.safeParse(null);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it("coerces a numeric string to a number", () => {
    const result = validator.safeParse("42");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(42);
  });

  it("accepts a real zero as zero, not as unset", () => {
    const result = validator.safeParse("0");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it("rejects a negative number", () => {
    expect(validator.safeParse(-1).success).toBe(false);
  });

  it("rejects a non-integer", () => {
    expect(validator.safeParse(1.5).success).toBe(false);
  });
});
