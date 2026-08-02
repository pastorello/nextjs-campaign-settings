import { describe, expect, it } from "vitest";

import isObjectArray from "./isObjectArray";

describe("isObjectArray", () => {
  it.each([
    ["an array of objects", [{ a: 1 }, { b: 2 }], true],
    ["an empty array", [], true],
    ["an array containing null", [{ a: 1 }, null], false],
    ["an array of primitives", [1, 2, 3], false],
    ["not an array", "not-an-array", false],
    ["null", null, false],
  ])("%s -> %s", (_label, value, expected) => {
    expect(isObjectArray(value)).toBe(expected);
  });
});
