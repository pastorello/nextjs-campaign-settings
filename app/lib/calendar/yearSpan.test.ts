import { describe, expect, it } from "vitest";

import { yearSpan } from "./yearSpan";

describe("yearSpan (SPEC-014 T6)", () => {
  it("is null for no days", () => {
    expect(yearSpan([])).toBeNull();
  });

  it("covers the whole years the days fall in", () => {
    // Day 400 is in year 1; day 10 in year 0; day 1100 in year 3.
    expect(yearSpan([400, 10, 1100])).toEqual({
      firstDay: 0,
      lastDay: 4 * 365 - 1,
    });
  });

  it("covers one whole year for a single day", () => {
    expect(yearSpan([365])).toEqual({ firstDay: 365, lastDay: 729 });
  });
});
