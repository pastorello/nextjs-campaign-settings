import { describe, expect, it } from "vitest";

import { monthGridKeyTarget } from "./monthGridKeyTarget";

// A 30-day month whose day 1 falls on column 2: day 10 is column 4.
const month = { daysInMonth: 30, weekLength: 7 };
const at = (day: number) => ({ ...month, day, weekday: (day + 1) % 7 });

describe("monthGridKeyTarget (SPEC-014 T9)", () => {
  it("moves a day with the left and right arrows", () => {
    expect(monthGridKeyTarget("ArrowLeft", at(10))).toEqual({
      kind: "day",
      day: 9,
    });
    expect(monthGridKeyTarget("ArrowRight", at(10))).toEqual({
      kind: "day",
      day: 11,
    });
  });

  it("moves a week with the up and down arrows", () => {
    expect(monthGridKeyTarget("ArrowUp", at(10))).toEqual({
      kind: "day",
      day: 3,
    });
    expect(monthGridKeyTarget("ArrowDown", at(10))).toEqual({
      kind: "day",
      day: 17,
    });
  });

  it("stays on the focused day rather than leaving the month", () => {
    expect(monthGridKeyTarget("ArrowLeft", at(1))).toEqual({
      kind: "day",
      day: 1,
    });
    expect(monthGridKeyTarget("ArrowRight", at(30))).toEqual({
      kind: "day",
      day: 30,
    });
    expect(monthGridKeyTarget("ArrowUp", at(5))).toEqual({
      kind: "day",
      day: 5,
    });
    expect(monthGridKeyTarget("ArrowDown", at(26))).toEqual({
      kind: "day",
      day: 26,
    });
  });

  it("goes to the week's first and last day with Home and End", () => {
    // Day 10 is column 4: its row runs from day 6 to day 12.
    expect(monthGridKeyTarget("Home", at(10))).toEqual({ kind: "day", day: 6 });
    expect(monthGridKeyTarget("End", at(10))).toEqual({ kind: "day", day: 12 });
  });

  it("stops Home and End at the month's edges in a partial row", () => {
    // Day 3 is column 4 of the first row, which starts at day 1.
    expect(monthGridKeyTarget("Home", at(3))).toEqual({ kind: "day", day: 1 });
    // Day 29 is column 2 of the last row, which ends at day 30.
    expect(monthGridKeyTarget("End", at(29))).toEqual({ kind: "day", day: 30 });
  });

  it("turns the month with PageUp and PageDown", () => {
    expect(monthGridKeyTarget("PageUp", at(10))).toEqual({
      kind: "month",
      offset: -1,
    });
    expect(monthGridKeyTarget("PageDown", at(10))).toEqual({
      kind: "month",
      offset: 1,
    });
  });

  it("leaves every other key alone", () => {
    for (const key of ["Enter", " ", "Tab", "a", "Escape"]) {
      expect(monthGridKeyTarget(key, at(10))).toBeNull();
    }
  });
});
