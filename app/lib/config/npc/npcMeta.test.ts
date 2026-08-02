import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import queryFields from "../queryFields";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import npcMeta from "./npcMeta";

describePageMetaInvariants("npcMeta", npcMeta);

describe("npcMeta (TD-40)", () => {
  it("every declared field is filterable (TD-12's single filter list)", () => {
    const filterable: string[] = queryFields[PageType.Npc];

    for (const key of Object.keys(npcMeta)) {
      expect(filterable).toContain(key);
    }
  });
});
