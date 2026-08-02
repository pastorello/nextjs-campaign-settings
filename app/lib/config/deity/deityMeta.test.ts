import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import queryFields from "../queryFields";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import deitiesMeta from "./deityMeta";

describePageMetaInvariants("deityMeta", deitiesMeta);

describe("deityMeta (TD-40)", () => {
  it("every declared field is filterable (TD-12's single filter list)", () => {
    const filterable: string[] = queryFields[PageType.Deity];

    for (const key of Object.keys(deitiesMeta)) {
      expect(filterable).toContain(key);
    }
  });
});
