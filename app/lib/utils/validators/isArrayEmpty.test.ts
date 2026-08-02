import { describe, expect, it } from "vitest";

import isArrayEmpty from "./isArrayEmpty";

describe("isArrayEmpty", () => {
  it.each([
    ["an empty array", [], true],
    ["a non-empty array", [1], false],
    ["not an array", "not-an-array", true],
    ["null", null, true],
    ["undefined", undefined, true],
  ])("%s -> %s", (_label, value, expected) => {
    expect(isArrayEmpty(value)).toBe(expected);
  });
});
