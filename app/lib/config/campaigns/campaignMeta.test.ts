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

  // Regression (T10, found by the a11y e2e's fixture setup): `CampaignForm`
  // submits an empty synopsis as an explicit `null` — `Campaign` types it
  // `string | null` — but the validator was a bare `.optional()`, which only
  // tolerates `undefined`. Same gap T7/T8 fixed for `adventureMeta.synopsis`
  // and `sceneMeta.description`, so a minimal title-only create failed.
  it("accepts a null synopsis, the same as an unset optional string column", () => {
    expect(campaignMeta.synopsis.validator.safeParse(null).success).toBe(true);
  });
});
