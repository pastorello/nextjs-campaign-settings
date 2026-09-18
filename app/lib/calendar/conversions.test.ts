import { describe, expect, it } from "vitest";
import { dateToUniversalDay } from "./dateToUniversalDay";
import { dayOfYear } from "./dayOfYear";
import { isValidDayOfMonth } from "./isValidDayOfMonth";
import { isValidUniversalDate } from "./isValidUniversalDate";
import { isValidUniversalDay } from "./isValidUniversalDay";
import { mod } from "./mod";
import {
  DAYS_PER_YEAR,
  MONTH_LENGTHS,
  MONTH_START_DAYS,
  MONTHS_PER_YEAR,
} from "./monthLengths";
import {
  systemYearFromUniversalYear,
  universalYearFromSystemYear,
} from "./systemYear";
import { toYearLabel } from "./toYearLabel";
import { universalDayToDate } from "./universalDayToDate";

/** The Cataclysm's universal year, SPEC-014 §5.2's worked example. */
const ANCHOR = 5770;

function everyDayOfYear(universalYear: number): number[] {
  return Array.from(
    { length: DAYS_PER_YEAR },
    (_, i) => universalYear * DAYS_PER_YEAR + i
  );
}

describe("the shape of the year", () => {
  it("has twelve Gregorian months summing to 365 days", () => {
    expect(MONTHS_PER_YEAR).toBe(12);
    expect(MONTH_LENGTHS.reduce((a, b) => a + b, 0)).toBe(DAYS_PER_YEAR);
    expect(MONTH_START_DAYS).toEqual([
      0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
    ]);
  });
});

describe("mod", () => {
  it("is non-negative for negative values, unlike %", () => {
    expect(mod(-1, 28)).toBe(27);
    expect(mod(-28, 28)).toBe(0);
    expect(mod(-29, 28)).toBe(27);
    expect(mod(30, 28)).toBe(2);
  });
});

describe("universalDayToDate / dateToUniversalDay", () => {
  it.each([
    [0, { universalYear: 0, monthIndex: 0, day: 1 }], // the dawn of time
    [30, { universalYear: 0, monthIndex: 0, day: 31 }],
    [31, { universalYear: 0, monthIndex: 1, day: 1 }],
    [58, { universalYear: 0, monthIndex: 1, day: 28 }],
    [59, { universalYear: 0, monthIndex: 2, day: 1 }], // no 29 February
    [364, { universalYear: 0, monthIndex: 11, day: 31 }],
    [365, { universalYear: 1, monthIndex: 0, day: 1 }], // 31 Dec → 1 Jan
    [ANCHOR * 365, { universalYear: ANCHOR, monthIndex: 0, day: 1 }],
    [ANCHOR * 365 - 1, { universalYear: ANCHOR - 1, monthIndex: 11, day: 31 }],
  ])("day %i is %o", (day, date) => {
    expect(universalDayToDate(day)).toEqual(date);
    expect(dateToUniversalDay(date)).toBe(day);
  });

  it.each([0, 1, 2, 7, ANCHOR - 1, ANCHOR, ANCHOR + 1])(
    "round-trips every day of universal year %i",
    (year) => {
      for (const day of everyDayOfYear(year)) {
        const date = universalDayToDate(day);
        expect(date.universalYear).toBe(year);
        expect(isValidUniversalDate(date)).toBe(true);
        expect(dateToUniversalDay(date)).toBe(day);
      }
    }
  );

  it("round-trips every valid date of a year, month by month", () => {
    for (const [monthIndex, length] of MONTH_LENGTHS.entries()) {
      for (let day = 1; day <= length; day++) {
        const date = { universalYear: 3, monthIndex, day };
        expect(universalDayToDate(dateToUniversalDay(date))).toEqual(date);
      }
    }
  });

  it("walks forward one day at a time across a year boundary", () => {
    const last = dateToUniversalDay({
      universalYear: 1,
      monthIndex: 11,
      day: 31,
    });
    expect(universalDayToDate(last + 1)).toEqual({
      universalYear: 2,
      monthIndex: 0,
      day: 1,
    });
  });

  it("rejects a day before the dawn of time or a fractional day", () => {
    expect(() => universalDayToDate(-1)).toThrow(RangeError);
    expect(() => universalDayToDate(1.5)).toThrow(RangeError);
  });

  it("rejects a date that does not exist or precedes the dawn", () => {
    expect(() =>
      dateToUniversalDay({ universalYear: 0, monthIndex: 3, day: 31 })
    ).toThrow(RangeError);
    expect(() =>
      dateToUniversalDay({ universalYear: -1, monthIndex: 11, day: 31 })
    ).toThrow(RangeError);
  });
});

describe("dayOfYear", () => {
  it("restarts at 0 on each 1 January", () => {
    expect(dayOfYear(0)).toBe(0);
    expect(dayOfYear(364)).toBe(364);
    expect(dayOfYear(365)).toBe(0);
    expect(dayOfYear(ANCHOR * 365 + 45)).toBe(45);
  });
});

describe("system years", () => {
  it("counts the anchor year as year 0, the year before as −1", () => {
    expect(systemYearFromUniversalYear(ANCHOR, ANCHOR)).toBe(0);
    expect(systemYearFromUniversalYear(ANCHOR - 1, ANCHOR)).toBe(-1);
    expect(systemYearFromUniversalYear(ANCHOR + 1230, ANCHOR)).toBe(1230);
    expect(systemYearFromUniversalYear(ANCHOR - 330, ANCHOR)).toBe(-330);
  });

  it("the universal count is the system anchored at 0", () => {
    expect(systemYearFromUniversalYear(42, 0)).toBe(42);
  });

  it("round-trips every day of the years around the anchor (−1, 0, 1)", () => {
    for (const systemYear of [-1, 0, 1]) {
      const universalYear = universalYearFromSystemYear(systemYear, ANCHOR);
      for (const day of everyDayOfYear(universalYear)) {
        const date = universalDayToDate(day);
        const shown = systemYearFromUniversalYear(date.universalYear, ANCHOR);
        expect(shown).toBe(systemYear);
        const typedBack = {
          ...date,
          universalYear: universalYearFromSystemYear(shown, ANCHOR),
        };
        expect(dateToUniversalDay(typedBack)).toBe(day);
      }
    }
  });

  it("only re-labels the year: day and month are the same in every system", () => {
    const day = ANCHOR * 365 + 200;
    const date = universalDayToDate(day);
    for (const anchor of [0, 1, ANCHOR, ANCHOR + 500]) {
      const systemYear = systemYearFromUniversalYear(
        date.universalYear,
        anchor
      );
      expect(
        dateToUniversalDay({
          ...date,
          universalYear: universalYearFromSystemYear(systemYear, anchor),
        })
      ).toBe(day);
    }
  });
});

describe("toYearLabel", () => {
  it("labels by absolute value, with year 0 after the anchor", () => {
    expect(toYearLabel(-330)).toEqual({ absoluteYear: 330, era: "before" });
    expect(toYearLabel(-1)).toEqual({ absoluteYear: 1, era: "before" });
    expect(toYearLabel(0)).toEqual({ absoluteYear: 0, era: "after" });
    expect(toYearLabel(1230)).toEqual({ absoluteYear: 1230, era: "after" });
  });
});

describe("validation helpers", () => {
  it("isValidDayOfMonth knows each month's length", () => {
    expect(isValidDayOfMonth(0, 31)).toBe(true);
    expect(isValidDayOfMonth(1, 28)).toBe(true);
    expect(isValidDayOfMonth(1, 29)).toBe(false);
    expect(isValidDayOfMonth(3, 30)).toBe(true);
    expect(isValidDayOfMonth(3, 31)).toBe(false); // day 31 in a 30-day month
    expect(isValidDayOfMonth(11, 31)).toBe(true);
    expect(isValidDayOfMonth(0, 0)).toBe(false);
    expect(isValidDayOfMonth(0, 1.5)).toBe(false);
    expect(isValidDayOfMonth(-1, 1)).toBe(false);
    expect(isValidDayOfMonth(12, 1)).toBe(false);
  });

  it("isValidUniversalDay rejects days before the dawn and fractions", () => {
    expect(isValidUniversalDay(0)).toBe(true);
    expect(isValidUniversalDay(ANCHOR * 365)).toBe(true);
    expect(isValidUniversalDay(-1)).toBe(false);
    expect(isValidUniversalDay(0.5)).toBe(false);
    expect(isValidUniversalDay(Number.NaN)).toBe(false);
  });

  it("isValidUniversalDate rejects years before the dawn", () => {
    expect(
      isValidUniversalDate({ universalYear: 0, monthIndex: 0, day: 1 })
    ).toBe(true);
    expect(
      isValidUniversalDate({ universalYear: -1, monthIndex: 0, day: 1 })
    ).toBe(false);
    expect(
      isValidUniversalDate({ universalYear: 0.5, monthIndex: 0, day: 1 })
    ).toBe(false);
  });
});
