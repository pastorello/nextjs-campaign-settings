import { describe, expect, it } from "vitest";

import { adjacentMonth } from "./adjacentMonth";
import { buildMonthView } from "./buildMonthView";
import { dateToUniversalDay } from "./dateToUniversalDay";
import { MAX_UNIVERSAL_YEAR } from "./maxUniversalDay";
import { monthRange } from "./monthRange";
import type { GridEventDates } from "./MonthView";
import { occurrencesBetween } from "./occurrencesBetween";
import { monthGridParams, parseMonthGridParams } from "./parseMonthGridParams";

const day = (universalYear: number, monthIndex: number, dayOfMonth: number) =>
  dateToUniversalDay({ universalYear, monthIndex, day: dayOfMonth });

interface TestEvent extends GridEventDates {
  id: number;
}

const event = (overrides: Partial<TestEvent> & { id: number }): TestEvent => ({
  startDay: 0,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  ...overrides,
});

/** The ids of the events on each day of the month that has any. */
const eventDays = (view: ReturnType<typeof buildMonthView<TestEvent>>) =>
  Object.fromEntries(
    view.days
      .filter((d) => d.events.length > 0)
      .map((d) => [d.day, d.events.map(({ event }) => event.id)])
  );

describe("monthRange", () => {
  it("gives a month's first and last universal days", () => {
    expect(monthRange({ universalYear: 0, monthIndex: 0 })).toEqual({
      firstDay: 0,
      lastDay: 30,
    });
    expect(monthRange({ universalYear: 1, monthIndex: 1 })).toEqual({
      firstDay: 365 + 31,
      lastDay: 365 + 31 + 27,
    });
  });
});

describe("buildMonthView — the weeks", () => {
  it("aligns weekdays across a year boundary", () => {
    // Year 0's December starts on day 334 = 47 × 7 + 5: weekday 5.
    const december = buildMonthView(
      { universalYear: 0, monthIndex: 11 },
      [],
      null
    );
    expect(december.leadingBlanks).toBe(5);
    // 5 blanks + 31 days = 36 cells: 6 trailing blanks close the 6th week.
    expect(december.trailingBlanks).toBe(6);
    expect(december.weeks).toHaveLength(6);
    const newYearsEve = december.days.at(-1);
    expect(newYearsEve?.universalDay).toBe(364);
    expect(newYearsEve?.weekday).toBe(0);
    expect(december.weeks[5]?.[0]).toBe(newYearsEve);

    // …so year 1 opens on the next weekday, 1, one blank in.
    const january = buildMonthView(
      { universalYear: 1, monthIndex: 0 },
      [],
      null
    );
    expect(january.leadingBlanks).toBe(1);
    expect(january.days[0]?.universalDay).toBe(365);
    expect(january.days[0]?.weekday).toBe(1);
    expect(january.weeks[0]?.[1]).toBe(january.days[0]);
    // 1 + 31 = 32 cells: 3 trailing blanks, 5 weeks.
    expect(january.trailingBlanks).toBe(3);
    expect(january.weeks).toHaveLength(5);
  });

  it("puts every day under its own weekday's column", () => {
    const view = buildMonthView(
      { universalYear: 5770, monthIndex: 1 },
      [],
      null
    );
    view.weeks.forEach((week) => {
      expect(week).toHaveLength(7);
      week.forEach((cell, column) => {
        if (cell !== null) expect(cell.weekday).toBe(column);
      });
    });
    expect(view.weeks.flat().filter(Boolean)).toHaveLength(28);
  });
});

describe("buildMonthView — moon and zodiac", () => {
  it("runs the moon on a 28-day cycle from its reference", () => {
    const reference = day(5, 0, 1);
    const view = buildMonthView(
      { universalYear: 5, monthIndex: 0 },
      [],
      reference
    );
    expect(view.days[0]?.moonPhase).toBe("new");
    expect(view.days[14]?.moonPhase).toBe("full"); // day 15, 14 days in
    expect(view.days[28]?.moonPhase).toBe("new"); // day 29, 28 days in
    expect(view.days[27]?.moonPhase).toBe("waningCrescent");
  });

  it("shows no moon without a reference", () => {
    const view = buildMonthView({ universalYear: 5, monthIndex: 0 }, [], null);
    expect(view.days.every(({ moonPhase }) => moonPhase === null)).toBe(true);
  });

  it("changes sign on the boundary day inside a month", () => {
    const january = buildMonthView(
      { universalYear: 7, monthIndex: 0 },
      [],
      null
    );
    expect(january.days[18]?.zodiacSign).toBe("sagittarius"); // 19 January
    expect(january.days[19]?.zodiacSign).toBe("capricorn"); // 20 January
    const november = buildMonthView(
      { universalYear: 7, monthIndex: 10 },
      [],
      null
    );
    expect(november.days[21]?.zodiacSign).toBe("libra");
    expect(november.days[22]?.zodiacSign).toBe("scorpio");
    expect(november.days[28]?.zodiacSign).toBe("ophiuchus");
  });
});

describe("buildMonthView — events", () => {
  it("places a one-day event on its day, with its hours", () => {
    const view = buildMonthView(
      { universalYear: 0, monthIndex: 2 },
      [event({ id: 1, startDay: day(0, 2, 10), startHour: 9, endHour: null })],
      null
    );
    expect(eventDays(view)).toEqual({ 10: [1] });
    expect(view.days[9]?.events[0]).toMatchObject({
      continuesFromBefore: false,
      continuesAfter: false,
      startHour: 9,
      endHour: null,
    });
  });

  it("spans a multi-day event across its days, clipped to the month", () => {
    const crossing = event({
      id: 1,
      startDay: day(0, 0, 30),
      startHour: 20,
      endDay: day(0, 1, 2),
      endHour: 6,
    });
    const january = buildMonthView(
      { universalYear: 0, monthIndex: 0 },
      [crossing],
      null
    );
    expect(eventDays(january)).toEqual({ 30: [1], 31: [1] });
    expect(january.days[29]?.events[0]).toMatchObject({
      continuesFromBefore: false,
      continuesAfter: true,
      startHour: 20,
      endHour: null,
    });

    const february = buildMonthView(
      { universalYear: 0, monthIndex: 1 },
      [crossing],
      null
    );
    expect(eventDays(february)).toEqual({ 1: [1], 2: [1] });
    expect(february.days[0]?.events[0]).toMatchObject({
      continuesFromBefore: true,
      continuesAfter: true,
      startHour: null,
      endHour: null,
      occurrenceStartDay: crossing.startDay,
    });
    expect(february.days[1]?.events[0]).toMatchObject({
      continuesFromBefore: true,
      continuesAfter: false,
      endHour: 6,
    });
  });

  it("shows a yearly event on the same day of a later year", () => {
    const festival = event({
      id: 1,
      startDay: day(10, 2, 5),
      startHour: 18,
      repeatsYearly: true,
    });
    const later = buildMonthView(
      { universalYear: 5770, monthIndex: 2 },
      [festival],
      null
    );
    expect(eventDays(later)).toEqual({ 5: [1] });
    expect(later.days[4]?.events[0]).toMatchObject({
      occurrenceStartDay: day(5770, 2, 5),
      startHour: 18,
    });
    // Not in another month of that year, nor before its start year.
    const april = buildMonthView(
      { universalYear: 5770, monthIndex: 3 },
      [festival],
      null
    );
    expect(eventDays(april)).toEqual({});
    const before = buildMonthView(
      { universalYear: 9, monthIndex: 2 },
      [festival],
      null
    );
    expect(eventDays(before)).toEqual({});
  });

  it("carries a yearly event across the year's end from its second year on", () => {
    const winter = event({
      id: 1,
      startDay: day(3, 11, 30),
      endDay: day(4, 0, 2),
      repeatsYearly: true,
    });
    // Its first occurrence begins in year 3's December: year 3's January
    // holds nothing, year 4's January holds that first occurrence's tail.
    const januaryOfStart = buildMonthView(
      { universalYear: 3, monthIndex: 0 },
      [winter],
      null
    );
    expect(eventDays(januaryOfStart)).toEqual({});
    const januaryAfter = buildMonthView(
      { universalYear: 90, monthIndex: 0 },
      [winter],
      null
    );
    expect(eventDays(januaryAfter)).toEqual({ 1: [1], 2: [1] });
    const december = buildMonthView(
      { universalYear: 90, monthIndex: 11 },
      [winter],
      null
    );
    expect(eventDays(december)).toEqual({ 30: [1], 31: [1] });
  });

  it("orders a day's events by occurrence start, untimed first", () => {
    const fifth = day(0, 4, 5);
    const view = buildMonthView(
      { universalYear: 0, monthIndex: 4 },
      [
        event({ id: 1, startDay: fifth, startHour: 12 }),
        event({ id: 2, startDay: fifth }),
        event({ id: 3, startDay: fifth - 2, endDay: fifth }),
        event({ id: 4, startDay: fifth, startHour: 8 }),
      ],
      null
    );
    expect(eventDays(view)[5]).toEqual([3, 2, 4, 1]);
  });
});

describe("occurrencesBetween", () => {
  it("finds nothing for a one-off event outside the range", () => {
    expect(
      occurrencesBetween(
        { startDay: 100, endDay: 105, repeatsYearly: false },
        106,
        200
      )
    ).toEqual([]);
    expect(
      occurrencesBetween(
        { startDay: 100, endDay: 105, repeatsYearly: false },
        105,
        200
      )
    ).toEqual([{ startDay: 100, endDay: 105 }]);
  });

  it("finds every yearly occurrence over a range of years", () => {
    expect(
      occurrencesBetween(
        { startDay: 10, endDay: null, repeatsYearly: true },
        0,
        3 * 365
      )
    ).toEqual([
      { startDay: 10, endDay: 10 },
      { startDay: 375, endDay: 375 },
      { startDay: 740, endDay: 740 },
    ]);
  });
});

describe("adjacentMonth", () => {
  it("steps across a year's end both ways", () => {
    expect(adjacentMonth({ universalYear: 4, monthIndex: 11 }, 1)).toEqual({
      universalYear: 5,
      monthIndex: 0,
    });
    expect(adjacentMonth({ universalYear: 5, monthIndex: 0 }, -1)).toEqual({
      universalYear: 4,
      monthIndex: 11,
    });
  });

  it("stops at either end of time", () => {
    expect(adjacentMonth({ universalYear: 0, monthIndex: 0 }, -1)).toBeNull();
    expect(
      adjacentMonth({ universalYear: MAX_UNIVERSAL_YEAR, monthIndex: 11 }, 1)
    ).toBeNull();
  });
});

describe("parseMonthGridParams", () => {
  it("reads the grid view and a month, the month 1-based", () => {
    expect(
      parseMonthGridParams({ view: "grid", year: "5770", month: "3" })
    ).toEqual({
      view: "grid",
      month: { universalYear: 5770, monthIndex: 2 },
    });
    expect(monthGridParams({ universalYear: 5770, monthIndex: 2 })).toEqual({
      year: "5770",
      month: "3",
    });
  });

  it("defaults to the list and reads a malformed month as absent", () => {
    expect(parseMonthGridParams({})).toEqual({ view: "list", month: null });
    for (const [year, month] of [
      ["5770", "0"],
      ["5770", "13"],
      ["-1", "1"],
      ["1.5", "1"],
      ["x", "1"],
      [String(MAX_UNIVERSAL_YEAR + 1), "1"],
    ]) {
      expect(
        parseMonthGridParams({ view: "grid", year, month }).month
      ).toBeNull();
    }
  });
});
