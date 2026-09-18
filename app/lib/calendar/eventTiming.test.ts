import { describe, expect, it } from "vitest";

import { eventTiming, occurrenceFrom } from "./eventTiming";
import { upcomingEvents } from "./upcomingEvents";

const YEAR = 365;

const event = (
  startDay: number,
  endDay: number | null = null,
  repeatsYearly = false,
  id = 1
) => ({ id, startDay, startHour: null, endDay, repeatsYearly });

describe("eventTiming (SPEC-014 §5.5, T6)", () => {
  it("marks nothing without a current day", () => {
    expect(eventTiming(event(10), null)).toBeNull();
  });

  it("reads a one-day event as past, current or upcoming against today", () => {
    expect(eventTiming(event(10), 11)?.timing).toBe("past");
    expect(eventTiming(event(10), 10)?.timing).toBe("current");
    expect(eventTiming(event(10), 9)?.timing).toBe("upcoming");
  });

  it("reads a multi-day event by its end: current while it spans today", () => {
    expect(eventTiming(event(10, 15), 9)?.timing).toBe("upcoming");
    expect(eventTiming(event(10, 15), 10)?.timing).toBe("current");
    expect(eventTiming(event(10, 15), 15)?.timing).toBe("current");
    expect(eventTiming(event(10, 15), 16)?.timing).toBe("past");
  });

  it("judges a yearly event by its next occurrence, so it is never past", () => {
    // Starts on day 100 of year 0; today is day 50 of year 3.
    const timed = eventTiming(event(100, null, true), 3 * YEAR + 50);

    expect(timed).toEqual({
      timing: "upcoming",
      startDay: 3 * YEAR + 100,
      endDay: 3 * YEAR + 100,
    });
    // After this year's occurrence, the next year's counts.
    expect(eventTiming(event(100, null, true), 3 * YEAR + 101)).toEqual({
      timing: "upcoming",
      startDay: 4 * YEAR + 100,
      endDay: 4 * YEAR + 100,
    });
  });

  it("reads a yearly event as current on the day of an occurrence", () => {
    expect(eventTiming(event(100, 102, true), 2 * YEAR + 101)).toEqual({
      timing: "current",
      startDay: 2 * YEAR + 100,
      endDay: 2 * YEAR + 102,
    });
  });

  it("carries a yearly occurrence spanning the year boundary into the next year", () => {
    // 30 December – 2 January, first held in year 0.
    const newYear = event(363, 366, true);

    // 1 January of year 5: the occurrence that began on 30 December of year 4.
    expect(eventTiming(newYear, 5 * YEAR)).toEqual({
      timing: "current",
      startDay: 4 * YEAR + 363,
      endDay: 4 * YEAR + 366,
    });
    // 3 January of year 5: that one is over; the next begins in December.
    expect(eventTiming(newYear, 5 * YEAR + 2)).toEqual({
      timing: "upcoming",
      startDay: 5 * YEAR + 363,
      endDay: 5 * YEAR + 366,
    });
  });

  it("uses a yearly event's own dates before its first year", () => {
    expect(eventTiming(event(4 * YEAR, null, true), 10)).toEqual({
      timing: "upcoming",
      startDay: 4 * YEAR,
      endDay: 4 * YEAR,
    });
  });
});

describe("occurrenceFrom", () => {
  it("is the event's own span for a one-off event, even when past", () => {
    expect(occurrenceFrom(event(10, 12), 500)).toEqual({
      startDay: 10,
      endDay: 12,
    });
  });
});

describe("upcomingEvents (SPEC-014 §5.5, T6)", () => {
  it("is empty without a current day", () => {
    expect(upcomingEvents([event(10)], null, 3)).toEqual([]);
  });

  it("takes the next events after today, soonest first, at most `count`", () => {
    const events = [
      event(5, null, false, 1), // past
      event(8, 12, false, 2), // current: not "upcoming"
      event(40, null, false, 3),
      event(20, null, false, 4),
      event(30, null, false, 5),
      event(50, null, false, 6),
    ];

    expect(upcomingEvents(events, 10, 3).map(({ event: e }) => e.id)).toEqual([
      4, 5, 3,
    ]);
  });

  it("orders a yearly event by its next occurrence, across the year boundary", () => {
    const festival = event(2, null, true, 1); // 3 January, every year
    const lateInYear = event(YEAR + 360, null, false, 2);

    // Today is 20 December of year 1: the festival's next date is in year 2.
    const upcoming = upcomingEvents([festival, lateInYear], YEAR + 353, 3);

    expect(upcoming.map(({ event: e }) => e.id)).toEqual([2, 1]);
    expect(upcoming[1]?.startDay).toBe(2 * YEAR + 2);
  });
});
