import { describe, expect, it } from "vitest";

import optionArrayValidator from "./optionArrayValidator";

const options = [
  { value: 0, labelKey: "a" },
  { value: 1, labelKey: "b" },
  { value: 3, labelKey: "c" },
];

describe("optionArrayValidator", () => {
  const validator = optionArrayValidator(options);

  it("accepts an array whose elements are all in the option list", () => {
    expect(validator.safeParse([0, 3]).success).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(validator.safeParse([]).success).toBe(true);
  });

  it("rejects an array containing a value absent from the option list (TD-61)", () => {
    expect(validator.safeParse([0, 999]).success).toBe(false);
  });
});
