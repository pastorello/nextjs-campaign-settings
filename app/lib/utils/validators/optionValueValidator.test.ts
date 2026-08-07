import { describe, expect, it } from "vitest";

import optionValueValidator from "./optionValueValidator";

const options = [
  { value: 0, labelKey: "a" },
  { value: 1, labelKey: "b" },
  { value: 3, labelKey: "c" },
];

describe("optionValueValidator", () => {
  const validator = optionValueValidator(options);

  it("accepts a value present in the option list", () => {
    expect(validator.safeParse(1).success).toBe(true);
  });

  it("rejects a value absent from the option list (TD-61)", () => {
    expect(validator.safeParse(999).success).toBe(false);
  });

  it("rejects a gap left by a removed option", () => {
    expect(validator.safeParse(2).success).toBe(false);
  });

  it("rejects a non-integer", () => {
    expect(validator.safeParse(0.5).success).toBe(false);
  });
});
