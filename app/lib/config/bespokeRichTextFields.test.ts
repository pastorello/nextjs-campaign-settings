import { describe, expect, it } from "vitest";

import ControlType from "@/app/lib/definitions/types/ControlType";
import calendarEventMeta from "./calendarEvent/calendarEventMeta";
import adventureMeta from "./campaigns/adventureMeta";
import campaignMeta from "./campaigns/campaignMeta";
import sceneMeta from "./campaigns/sceneMeta";

/**
 * The formatted-text fields outside `pageMetaFields` (SPEC-019 T5): the
 * ADR-0011 bespoke editors read these metas, and their Server Actions
 * validate with these validators — so this is where sanitising happens for
 * campaigns, adventures, scenes and calendar events.
 */
const fields = [
  ["campaign.synopsis", campaignMeta.synopsis],
  ["adventure.synopsis", adventureMeta.synopsis],
  ["scene.description", sceneMeta.description],
  ["calendarEvent.description", calendarEventMeta.description],
] as const;

describe("bespoke formatted-text fields (SPEC-019 T5)", () => {
  it.each(fields)("%s is a formatted-text field", (_name, meta) => {
    expect(meta.controlType).toBe(ControlType.RichText);
  });

  it.each(fields)("%s sanitises on validation", (_name, meta) => {
    expect(
      meta.validator.parse(
        '<p onclick="x()">Go <em>now</em><script>alert(1)</script></p>'
      )
    ).toBe("<p>Go <em>now</em></p>");
  });

  it.each(fields)("%s still clears with null", (_name, meta) => {
    expect(meta.validator.parse(null)).toBeUndefined();
  });

  it.each(fields)("%s keeps legacy plain text as it was", (_name, meta) => {
    expect(meta.validator.parse("Line & one\nLine two")).toBe(
      "Line & one\nLine two"
    );
  });
});
