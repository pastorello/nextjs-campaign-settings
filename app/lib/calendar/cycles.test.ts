import { describe, expect, it } from "vitest";
import { dateToUniversalDay } from "./dateToUniversalDay";
import { LUNAR_CYCLE_DAYS, moonPhaseOf } from "./moonPhaseOf";
import { MOON_PHASES } from "./MoonPhase";
import { weekdayOf } from "./weekdayOf";
import { ZODIAC_SIGNS } from "./ZodiacSign";
import { zodiacSignOf } from "./zodiacSignOf";

const day = (universalYear: number, monthIndex: number, dayOfMonth: number) =>
  dateToUniversalDay({ universalYear, monthIndex, day: dayOfMonth });

describe("weekdayOf", () => {
  it("starts the week at the dawn of time and never breaks it", () => {
    expect(weekdayOf(0)).toBe(0);
    expect(weekdayOf(6)).toBe(6);
    expect(weekdayOf(7)).toBe(0);
    // 365 = 52 × 7 + 1: each year starts one weekday later than the last.
    expect(weekdayOf(day(0, 11, 31))).toBe(0);
    expect(weekdayOf(day(1, 0, 1))).toBe(1);
    expect(weekdayOf(day(2, 0, 1))).toBe(2);
    expect(weekdayOf(day(7, 0, 1))).toBe(0);
  });

  it("advances by one every day across a year boundary", () => {
    const newYearsEve = day(5769, 11, 31);
    expect(weekdayOf(newYearsEve + 1)).toBe((weekdayOf(newYearsEve) + 1) % 7);
  });

  it("works on a hand-worked day far from the dawn", () => {
    // 5770 × 365 = 2 106 050 = 7 × 300 864 + 2
    expect(weekdayOf(day(5770, 0, 1))).toBe(2);
  });
});

describe("moonPhaseOf", () => {
  const reference = 100;

  it("shows no phase until a reference new moon is set", () => {
    expect(moonPhaseOf(0, null)).toBeNull();
    expect(moonPhaseOf(12345, null)).toBeNull();
  });

  it("gives each phase 3½ days: four for new, quarters and full, three between", () => {
    const phases = Array.from({ length: LUNAR_CYCLE_DAYS }, (_, i) =>
      moonPhaseOf(reference + i, reference)
    );
    expect(phases).toEqual([
      ...Array<string>(4).fill("new"),
      ...Array<string>(3).fill("waxingCrescent"),
      ...Array<string>(4).fill("firstQuarter"),
      ...Array<string>(3).fill("waxingGibbous"),
      ...Array<string>(4).fill("full"),
      ...Array<string>(3).fill("waningGibbous"),
      ...Array<string>(4).fill("lastQuarter"),
      ...Array<string>(3).fill("waningCrescent"),
    ]);
  });

  it.each([
    [100, "new"],
    [103, "new"],
    [104, "waxingCrescent"],
    [107, "firstQuarter"],
    [114, "full"],
    [127, "waningCrescent"],
    [128, "new"], // exactly one cycle later
    [100 + 28 * 1000, "new"],
  ])("day %i is %s", (d, phase) => {
    expect(moonPhaseOf(d, reference)).toBe(phase);
  });

  it.each([
    [99, "waningCrescent"], // the day before the reference
    [97, "waningCrescent"],
    [96, "lastQuarter"],
    [86, "full"],
    [72, "new"], // exactly one cycle earlier
    [0, "waxingGibbous"], // mod(0 − 100, 28) = 12 → floor(24 / 7) = 3
  ])("day %i before the reference is %s", (d, phase) => {
    expect(moonPhaseOf(d, reference)).toBe(phase);
  });

  it("repeats with a period of exactly 28 days, before and after the reference", () => {
    for (let d = 0; d < 400; d++) {
      expect(moonPhaseOf(d + LUNAR_CYCLE_DAYS, 200)).toBe(moonPhaseOf(d, 200));
    }
  });

  it("returns only the eight declared phases", () => {
    const seen = new Set(
      Array.from({ length: 56 }, (_, i) => moonPhaseOf(i, 5))
    );
    expect([...seen].sort()).toEqual([...MOON_PHASES].sort());
  });
});

describe("zodiacSignOf", () => {
  it.each([
    [0, 1, "sagittarius"], // 1 January: the tail of last year's Sagittarius
    [0, 19, "sagittarius"],
    [0, 20, "capricorn"],
    [1, 15, "capricorn"],
    [1, 16, "aquarius"],
    [2, 10, "aquarius"],
    [2, 11, "pisces"],
    [3, 17, "pisces"],
    [3, 18, "aries"],
    [4, 12, "aries"],
    [4, 13, "taurus"],
    [5, 20, "taurus"],
    [5, 21, "gemini"],
    [6, 19, "gemini"],
    [6, 20, "cancer"],
    [7, 9, "cancer"],
    [7, 10, "leo"],
    [8, 15, "leo"],
    [8, 16, "virgo"],
    [9, 29, "virgo"],
    [9, 30, "libra"],
    [10, 22, "libra"],
    [10, 23, "scorpio"],
    [10, 28, "scorpio"],
    [10, 29, "ophiuchus"],
    [11, 17, "ophiuchus"],
    [11, 18, "sagittarius"],
    [11, 31, "sagittarius"],
  ])("month %i day %i is %s", (monthIndex, dayOfMonth, sign) => {
    expect(zodiacSignOf(day(0, monthIndex, dayOfMonth))).toBe(sign);
    // The same day and month in any later year has the same sign.
    expect(zodiacSignOf(day(5770, monthIndex, dayOfMonth))).toBe(sign);
  });

  it("covers the year with all thirteen signs, each in one run (Sagittarius wraps)", () => {
    const counts = new Map<string, number>();
    for (let d = 0; d < 365; d++) {
      const sign = zodiacSignOf(d);
      counts.set(sign, (counts.get(sign) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([...ZODIAC_SIGNS].sort());
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(365);
    expect(counts.get("scorpio")).toBe(6);
    expect(counts.get("ophiuchus")).toBe(19);
    expect(counts.get("sagittarius")).toBe(14 + 19);
  });
});
