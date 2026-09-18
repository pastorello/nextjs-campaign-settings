import { describe, expect, it } from "vitest";

import { humanCountInputFixture as humanCount } from "@/app/lib/calendar/dateSystemFixtures";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import calendarSettingsMeta from "./calendarSettingsMeta";
import dateSystemMeta from "./dateSystemMeta";
import { dateSystemSchema } from "./dateSystemSchemas";

describePageMetaInvariants("dateSystemMeta", dateSystemMeta);
describePageMetaInvariants("calendarSettingsMeta", calendarSettingsMeta);

describe("dateSystemMeta (SPEC-014 T3)", () => {
  // The schemas are spelled out field by field for their types; a field
  // added to the meta and forgotten there would never be validated.
  it("validates every declared field in the action schema", () => {
    expect(Object.keys(dateSystemSchema.shape).sort()).toEqual(
      Object.keys(dateSystemMeta).sort()
    );
  });

  it("accepts the spec's worked example", () => {
    expect(dateSystemSchema.safeParse(humanCount).success).toBe(true);
  });

  it.each([11, 13])("refuses %i month names with its own key", (count) => {
    const result = dateSystemMeta.monthNames.validator.safeParse(
      Array.from({ length: count }, (_, index) => `M${index}`)
    );
    expect(result.error?.issues[0]?.message).toBe("monthNamesCount");
  });

  it.each([6, 8])("refuses %i weekday names with its own key", (count) => {
    const result = dateSystemMeta.weekdayNames.validator.safeParse(
      Array.from({ length: count }, (_, index) => `W${index}`)
    );
    expect(result.error?.issues[0]?.message).toBe("weekdayNamesCount");
  });

  it("refuses a blank month name", () => {
    const names = [...humanCount.monthNames];
    names[3] = "   ";
    expect(dateSystemMeta.monthNames.validator.safeParse(names).success).toBe(
      false
    );
  });

  it("refuses a negative or fractional anchor year", () => {
    expect(dateSystemMeta.anchorYear.validator.safeParse(-1).success).toBe(
      false
    );
    expect(dateSystemMeta.anchorYear.validator.safeParse(1.5).success).toBe(
      false
    );
  });

  it("lets the moon reference be cleared with null, but not set before day 0", () => {
    const { validator } = calendarSettingsMeta.moonNewMoonDay;
    expect(validator.safeParse(null).success).toBe(true);
    expect(validator.safeParse(-1).success).toBe(false);
  });
});
