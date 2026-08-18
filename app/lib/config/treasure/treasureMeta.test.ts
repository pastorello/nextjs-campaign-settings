import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import queryFields from "../queryFields";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import treasureMeta from "./treasureMeta";

describePageMetaInvariants("treasureMeta", treasureMeta);

describe("treasureMeta (SPEC-013 T4b)", () => {
  it("every declared field is filterable (TD-12's single filter list)", () => {
    const filterable: string[] = queryFields[PageType.Treasure];

    for (const key of Object.keys(treasureMeta)) {
      expect(filterable).toContain(key);
    }
  });

  it("rejects a negative value without throwing", () => {
    expect(treasureMeta.value.validator.safeParse(-5).success).toBe(false);
  });

  it("treats an empty string as no value, not zero", () => {
    const parsed = treasureMeta.value.validator.safeParse("");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toBeNull();
    }
  });
});
