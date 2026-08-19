import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import campaignMeta from "./campaignMeta";

describePageMetaInvariants("campaignMeta", campaignMeta);

describe("campaignMeta (SPEC-013 T4)", () => {
  it("rejects an empty title", () => {
    expect(campaignMeta.title.validator.safeParse("").success).toBe(false);
  });

  it("defaults party size to 4", () => {
    expect(campaignMeta.partySize.defaultValue).toBe(4);
  });

  it("rejects a non-positive party size", () => {
    expect(campaignMeta.partySize.validator.safeParse(0).success).toBe(false);
  });
});
