import { describe, expect, it } from "vitest";

import toFieldErrors from "./toFieldErrors";
import worldHistoryEventSchema from "./worldHistoryEventSchema";

const valid = {
  title: "La caduta di Kang",
  description: null,
  startDay: 1000,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  zoneIds: [],
  npcIds: [],
  deityIds: [],
  factionIds: [],
};

const errorsOf = (payload: unknown) => {
  const parsed = worldHistoryEventSchema.safeParse(payload);
  return parsed.success ? {} : toFieldErrors(parsed.error);
};

describe("worldHistoryEventSchema (SPEC-014 T5)", () => {
  it("accepts a one-day event with no links", () => {
    expect(worldHistoryEventSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses an empty title", () => {
    expect(errorsOf({ ...valid, title: "   " }).title).toBeDefined();
  });

  it("refuses a start before the dawn of time, with the date input's key", () => {
    expect(errorsOf({ ...valid, startDay: -1 }).startDay).toEqual([
      { key: "beforeDawnOfTime" },
    ]);
  });

  it("refuses a missing start (the date input's null)", () => {
    expect(errorsOf({ ...valid, startDay: null }).startDay).toBeDefined();
  });

  it("refuses an end before the start, on the end", () => {
    expect(errorsOf({ ...valid, endDay: 999 }).endDay).toEqual([
      { key: "endBeforeStart" },
    ]);
  });

  it("accepts equal start and end as a one-day event", () => {
    expect(errorsOf({ ...valid, endDay: 1000 })).toEqual({});
  });

  it("refuses an end hour before the start hour on the same day", () => {
    expect(
      errorsOf({ ...valid, startHour: 14, endDay: 1000, endHour: 9 }).endDay
    ).toEqual([{ key: "endBeforeStart" }]);
  });

  it("accepts an earlier end hour on a later day", () => {
    expect(
      errorsOf({ ...valid, startHour: 14, endDay: 1001, endHour: 9 })
    ).toEqual({});
  });

  it("refuses an end hour with no end day", () => {
    expect(errorsOf({ ...valid, endHour: 9 }).endHour).toEqual([
      { key: "invalid" },
    ]);
  });

  it("lets a yearly event span exactly a year (365 days, inclusive)", () => {
    expect(
      errorsOf({ ...valid, repeatsYearly: true, endDay: 1000 + 364 })
    ).toEqual({});
  });

  it("refuses a yearly event spanning more than a year", () => {
    expect(
      errorsOf({ ...valid, repeatsYearly: true, endDay: 1000 + 365 }).endDay
    ).toEqual([{ key: "repeatSpansOverAYear" }]);
  });

  it("lets a one-off event span more than a year", () => {
    expect(errorsOf({ ...valid, endDay: 1000 + 5000 })).toEqual({});
  });

  it("refuses an hour outside 0–23", () => {
    expect(errorsOf({ ...valid, startHour: 24 }).startHour).toBeDefined();
  });

  it("refuses a link id that is not a positive whole number", () => {
    expect(errorsOf({ ...valid, npcIds: [0] }).npcIds).toBeDefined();
  });
});
