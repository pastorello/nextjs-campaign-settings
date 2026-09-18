import { describe, expect, it } from "vitest";
import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import universalDayValidator from "./universalDayValidator";
import worldHourValidator from "./worldHourValidator";

const schema = z.object({
  startDay: universalDayValidator,
  startHour: worldHourValidator,
});

function errorsFor(input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? {} : toFieldErrors(result.error);
}

describe("the world date validators (SPEC-014 T4)", () => {
  it("accepts the dawn of time and an hourless date", () => {
    expect(errorsFor({ startDay: 0, startHour: null })).toEqual({});
    expect(errorsFor({ startDay: 2_106_050, startHour: 23 })).toEqual({});
  });

  it("refuses a day before the dawn with the input's own key", () => {
    expect(errorsFor({ startDay: -1, startHour: null }).startDay).toEqual([
      { key: "beforeDawnOfTime" },
    ]);
  });

  it("refuses a day the integer column cannot hold, and a fractional day", () => {
    expect(
      errorsFor({ startDay: 2_147_483_648, startHour: null }).startDay?.[0]?.key
    ).toBe("tooBig");
    expect(
      errorsFor({ startDay: 1.5, startHour: null }).startDay
    ).toBeDefined();
  });

  it("refuses an hour outside 0–23", () => {
    expect(errorsFor({ startDay: 0, startHour: 24 }).startHour?.[0]?.key).toBe(
      "tooBig"
    );
    expect(errorsFor({ startDay: 0, startHour: -1 }).startHour?.[0]?.key).toBe(
      "tooSmall"
    );
  });
});
