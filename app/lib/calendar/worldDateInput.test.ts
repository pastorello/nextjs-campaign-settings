import { describe, expect, it } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "./dateSystemFixtures";
import { MAX_UNIVERSAL_YEAR } from "./maxUniversalDay";
import { MONTH_LENGTHS } from "./monthLengths";
import { parseWorldDateFields } from "./parseWorldDateFields";
import { worldDateFieldsFromDay } from "./worldDateFieldsFromDay";

const ANCHOR = human.anchorYear;

describe("the date input's conversion (SPEC-014 §5.8, T4)", () => {
  // §8's first criterion, through the input's own path: typed → universal
  // day → re-displayed, for every day of the years around the anchor.
  it.each([-1, 0, 1])(
    "round-trips every day of human year %i through a universal day",
    (year) => {
      MONTH_LENGTHS.forEach((length, monthIndex) => {
        for (let day = 1; day <= length; day++) {
          const typed = {
            year: String(year),
            monthIndex,
            day: String(day),
            hour: 14,
          };
          const { universalDay, errors } = parseWorldDateFields(typed, human);

          expect(errors).toEqual({});
          expect(universalDay).not.toBeNull();
          expect(worldDateFieldsFromDay(universalDay, 14, human)).toEqual(
            typed
          );
        }
      });
    }
  );

  it("places the anchor year's first day at the anchor's universal year", () => {
    const { universalDay } = parseWorldDateFields(
      { year: "0", monthIndex: 0, day: "1", hour: null },
      human
    );
    expect(universalDay).toBe(ANCHOR * 365);

    const dayBefore = parseWorldDateFields(
      { year: "-1", monthIndex: 11, day: "31", hour: null },
      human
    );
    expect(dayBefore.universalDay).toBe(ANCHOR * 365 - 1);
  });

  it("reads the same universal day as the same day and month in both systems", () => {
    const day = (ANCHOR + 12) * 365 + 100;
    const inHuman = worldDateFieldsFromDay(day, null, human);
    const inUniversal = worldDateFieldsFromDay(day, null, universal);

    expect(inHuman.year).toBe("12");
    expect(inUniversal.year).toBe(String(ANCHOR + 12));
    expect(inHuman.monthIndex).toBe(inUniversal.monthIndex);
    expect(inHuman.day).toBe(inUniversal.day);
  });

  it("accepts the dawn of time itself", () => {
    expect(
      parseWorldDateFields(
        { year: "0", monthIndex: 0, day: "1", hour: null },
        universal
      )
    ).toEqual({ universalDay: 0, errors: {} });
    expect(
      parseWorldDateFields(
        { year: String(-ANCHOR), monthIndex: 0, day: "1", hour: null },
        human
      )
    ).toEqual({ universalDay: 0, errors: {} });
  });

  it("gives empty fields for no date, and reads empty fields as no date", () => {
    const empty = worldDateFieldsFromDay(null, null, human);
    expect(empty).toEqual({ year: "", monthIndex: 0, day: "", hour: null });
    expect(parseWorldDateFields(empty, human)).toEqual({
      universalDay: null,
      errors: {},
    });
  });
});

describe("the date input's field errors (SPEC-014 §5 edge cases)", () => {
  it("refuses a date before the dawn of time, on the year", () => {
    expect(
      parseWorldDateFields(
        { year: String(-ANCHOR - 1), monthIndex: 11, day: "31", hour: null },
        human
      )
    ).toEqual({
      universalDay: null,
      errors: { year: { key: "beforeDawnOfTime" } },
    });
    expect(
      parseWorldDateFields(
        { year: "-1", monthIndex: 0, day: "1", hour: null },
        universal
      ).errors
    ).toEqual({ year: { key: "beforeDawnOfTime" } });
  });

  it("refuses day 31 of a 30-day month, and 29 February", () => {
    expect(
      parseWorldDateFields(
        { year: "3", monthIndex: 3, day: "31", hour: null },
        human
      )
    ).toEqual({
      universalDay: null,
      errors: { day: { key: "dayNotInMonth", values: { days: 30 } } },
    });
    expect(
      parseWorldDateFields(
        { year: "3", monthIndex: 1, day: "29", hour: null },
        human
      ).errors.day
    ).toEqual({ key: "dayNotInMonth", values: { days: 28 } });
    expect(
      parseWorldDateFields(
        { year: "3", monthIndex: 0, day: "0", hour: null },
        human
      ).errors.day?.key
    ).toBe("dayNotInMonth");
  });

  it("refuses a year that is not a whole number", () => {
    for (const year of ["3.5", "-", "abc"]) {
      expect(
        parseWorldDateFields(
          { year, monthIndex: 0, day: "1", hour: null },
          human
        )
      ).toEqual({ universalDay: null, errors: { year: { key: "invalid" } } });
    }
  });

  it("refuses a year the database cannot hold", () => {
    const { universalDay, errors } = parseWorldDateFields(
      {
        year: String(MAX_UNIVERSAL_YEAR - ANCHOR + 1),
        monthIndex: 0,
        day: "1",
        hour: null,
      },
      human
    );
    expect(universalDay).toBeNull();
    expect(errors.year).toEqual({
      key: "tooBig",
      values: { maximum: MAX_UNIVERSAL_YEAR - ANCHOR },
    });
  });

  it("accepts the last day of the last year the database can hold", () => {
    const { universalDay } = parseWorldDateFields(
      {
        year: String(MAX_UNIVERSAL_YEAR),
        monthIndex: 11,
        day: "31",
        hour: null,
      },
      universal
    );
    expect(universalDay).toBeLessThanOrEqual(2_147_483_647);
  });
});
