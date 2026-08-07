import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import queryFields from "../queryFields";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import magicItemsMeta from "./magicItemMeta";

describePageMetaInvariants("magicItemsMeta", magicItemsMeta);

describe("magicItemsMeta (TD-40)", () => {
  it("every declared field is filterable (TD-12's single filter list)", () => {
    const filterable: string[] = queryFields[PageType.MagicItem];

    for (const key of Object.keys(magicItemsMeta)) {
      expect(filterable).toContain(key);
    }
  });
});
