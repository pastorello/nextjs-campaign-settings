import { describe, expect, it } from "vitest";

import applyLocationSort from "./applyLocationSort";

describe("applyLocationSort", () => {
  it("translates a location sort entry into ORDER BY zone.title", () => {
    const result = applyLocationSort([{ location: "asc" }]);

    expect(result).toEqual([{ zone: { title: "asc" } }]);
  });

  it("leaves every other entry untouched", () => {
    const result = applyLocationSort([{ name: "desc" }]);

    expect(result).toEqual([{ name: "desc" }]);
  });

  it("translates only the location entry in a mixed list", () => {
    const result = applyLocationSort([{ location: "desc" }, { name: "asc" }]);

    expect(result).toEqual([{ zone: { title: "desc" } }, { name: "asc" }]);
  });

  it("passes an empty list through unchanged", () => {
    expect(applyLocationSort([])).toEqual([]);
  });
});
