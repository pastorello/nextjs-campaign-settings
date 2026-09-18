import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import calendarEventMeta from "./calendarEventMeta";
import worldHistoryLinkMeta from "./worldHistoryLinkMeta";
import en from "@/messages/en.json";
import it_ from "@/messages/it.json";

describePageMetaInvariants("calendarEventMeta", calendarEventMeta);
describePageMetaInvariants("worldHistoryLinkMeta", worldHistoryLinkMeta);

const lookup = (catalogue: object, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node !== null && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      catalogue
    );

describe("calendarEventMeta (SPEC-014 T5)", () => {
  it.each(
    Object.values({ ...calendarEventMeta, ...worldHistoryLinkMeta }).map(
      (field) => field.labelKey
    )
  )("has the label %s in both catalogues", (labelKey) => {
    expect(typeof lookup(en, labelKey)).toBe("string");
    expect(typeof lookup(it_, labelKey)).toBe("string");
  });

  it("allows an open end (a one-day event) but not an open start", () => {
    expect(calendarEventMeta.endDay.validator.safeParse(null).success).toBe(
      true
    );
    expect(calendarEventMeta.startDay.validator.safeParse(null).success).toBe(
      false
    );
  });

  it("trims the title before requiring it", () => {
    expect(calendarEventMeta.title.validator.safeParse("  ").success).toBe(
      false
    );
    expect(calendarEventMeta.title.validator.parse(" Kang ")).toBe("Kang");
  });

  it("reads a null description as no description", () => {
    expect(calendarEventMeta.description.validator.parse(null)).toBeUndefined();
  });
});
