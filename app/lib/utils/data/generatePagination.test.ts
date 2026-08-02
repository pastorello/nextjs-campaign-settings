import { describe, expect, it } from "vitest";

import generatePagination from "./generatePagination";

describe("generatePagination", () => {
  it("lists every page without ellipsis when there are 7 or fewer", () => {
    expect(generatePagination(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(generatePagination(1, 1)).toEqual([1]);
  });

  it("shows the first 3, an ellipsis, and the last 2 when near the start", () => {
    expect(generatePagination(2, 10)).toEqual([1, 2, 3, "...", 9, 10]);
  });

  it("shows the first 2, an ellipsis, and the last 3 when near the end", () => {
    expect(generatePagination(9, 10)).toEqual([1, 2, "...", 8, 9, 10]);
  });

  it("shows the first page, the current page and neighbors, and the last page in the middle", () => {
    expect(generatePagination(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });
});
