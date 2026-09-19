import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany } },
}));

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import queryFields from "@/app/lib/config/queryFields";
import zoneMeta from "@/app/lib/config/geography/zoneMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import PageType from "@/app/lib/definitions/types/PageType";
import getQuery from "@/app/lib/data/getQuery";
import searchPlacesByTitle from "@/app/lib/data/maps/searchPlacesByTitle";

/**
 * SPEC-019 T6 — search ignores markup. Both free-text searches (every list
 * page's `?query=` through `getQuery`, and SPEC-011's `searchAllDomains`,
 * which reuses it plus `searchPlacesByTitle`) match only a record's name or
 * title: plain single-line fields that never hold formatted text (SPEC-019
 * §3). So no search reaches a formatted column, and a tag name or attribute
 * in one can never produce a match. These tests pin that, so a change that
 * starts searching a formatted field fails here and has to strip the markup
 * first (`richTextToPlainText`) — see the T6 note in SPEC-019 §10.
 */

type Row = Record<string, string>;
type ContainsWhere = Record<string, { contains: string; mode: "insensitive" }>;

/** What Postgres's `ILIKE '%term%'` does with a `contains` where clause. */
const matches = (row: Row, where: ContainsWhere) =>
  Object.entries(where).every(([field, { contains }]) =>
    (row[field] ?? "").toLowerCase().includes(contains.toLowerCase())
  );

const npc: Row = {
  name: "Mira the Bold",
  description:
    '<p>A <strong>brave</strong> guide, sister of <a data-record-domain="npc" data-record-id="4">Tobin</a>.</p>',
};

describe("free-text search ignores markup (SPEC-019 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(Object.values(PageType))(
    "the %s list searches no formatted-text field",
    (pageType) => {
      const { where } = getQuery<ContainsWhere>(
        { query: "strong" },
        queryFields[pageType]
      );

      for (const field of Object.keys(where)) {
        expect(
          pageMetaFields[field as keyof typeof pageMetaFields].controlType
        ).not.toBe(ControlType.RichText);
      }
    }
  );

  it.each(["strong", "data-record", "record-id", "<p>", "npc"])(
    'searching "%s" does not match a record only because of its markup',
    (term) => {
      const { where } = getQuery<ContainsWhere>(
        { query: term },
        queryFields[PageType.Npc]
      );

      expect(matches(npc, where)).toBe(false);
    }
  );

  it("still matches the words of the searched field", () => {
    const { where } = getQuery<ContainsWhere>(
      { query: "bold" },
      queryFields[PageType.Npc]
    );

    expect(matches(npc, where)).toBe(true);
  });

  it("the place search matches the plain-text title, never the description", async () => {
    findMany.mockResolvedValue([]);
    await searchPlacesByTitle("strong");

    const { where } = findMany.mock.calls[0]![0] as { where: ContainsWhere };
    expect(Object.keys(where)).toEqual(["title"]);
    expect(zoneMeta.title.controlType).not.toBe(ControlType.RichText);
  });
});
