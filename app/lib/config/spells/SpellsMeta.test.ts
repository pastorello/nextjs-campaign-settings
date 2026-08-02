import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import queryFields from "../queryFields";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import spellsMeta from "./SpellsMeta";

describePageMetaInvariants("spellsMeta", spellsMeta);

describe("spellsMeta (TD-40)", () => {
  it("every declared field is filterable (TD-12's single filter list)", () => {
    const filterable: string[] = queryFields[PageType.Spell];

    for (const key of Object.keys(spellsMeta)) {
      expect(filterable).toContain(key);
    }
  });
});
