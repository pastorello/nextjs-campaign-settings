import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

import {
  andWhere,
  dmOnlyFields,
  forReader,
  readerQueryInput,
} from "./readerQuery";

const ALL = { kind: "all" } as const;
const PLAYER = {
  kind: "campaign" as const,
  campaignId: 7,
  zones: new Set<number>(),
  pois: new Set<number>(),
};

describe("readerQuery (SPEC-022 T8b)", () => {
  it("knows an NPC's DM-only fields from their metadata", () => {
    expect(dmOnlyFields(PageType.Npc)).toEqual(
      expect.arrayContaining(["motivations", "secrets", "revealedTo"])
    );
    expect(dmOnlyFields(PageType.Npc)).not.toContain("name");
    expect(dmOnlyFields(PageType.MagicItem)).toEqual(["revealedToDnd5e"]);
    expect(dmOnlyFields(PageType.Spell)).toEqual([]);
  });

  it("leaves the DM's query alone", () => {
    const params = { secrets: "x", sortFields: '{"secrets":"asc"}' };

    const result = readerQueryInput(PageType.Npc, params, ALL);

    expect(result.params).toBe(params);
    expect(result.fields).toContain("secrets");
  });

  it("drops a player's filters and sort terms on DM-only fields", () => {
    const result = readerQueryInput(
      PageType.Npc,
      {
        query: "Mira",
        secrets: "traitor",
        motivations: "gold",
        sortFields: '{"secrets":"asc","title":"desc"}',
      },
      PLAYER
    );

    expect(result.params).toEqual({
      query: "Mira",
      sortFields: '{"title":"desc"}',
    });
    expect(result.fields).not.toContain("secrets");
    expect(result.fields).not.toContain("motivations");
    expect(result.fields).toContain("title");
  });

  it("drops the sort parameter when only DM-only terms were in it", () => {
    const result = readerQueryInput(
      PageType.Npc,
      { sortFields: '{"motivations":"desc"}' },
      PLAYER
    );

    expect(result.params).toEqual({ sortFields: undefined });
  });

  it("blanks a player's DM-only values, keeping the rest", () => {
    const rows = [
      {
        id: 1,
        name: "Mira",
        secrets: "<p>traitor</p>",
        motivations: "<p>gold</p>",
        revealedTo: [7, 9],
      },
    ];

    expect(forReader(PageType.Npc, rows, PLAYER)).toEqual([
      { id: 1, name: "Mira", secrets: "", motivations: "", revealedTo: [] },
    ]);
    expect(forReader(PageType.Npc, rows, ALL)).toBe(rows);
  });

  it("narrows a where by the scope's fragment, and only then", () => {
    expect(andWhere({ name: "x" }, {})).toEqual({ name: "x" });
    expect(
      andWhere({ name: "x" }, { revealedTo: { some: { id: 7 } } })
    ).toEqual({ AND: [{ name: "x" }, { revealedTo: { some: { id: 7 } } }] });
  });
});
