import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";

// buildLocationWhere's zoneId branch calls requireSession(); mocked so the
// real next-auth config never loads.
vi.mock("@/auth", () => ({ auth: vi.fn() }));

// Hoisted: the fetchers below are imported statically, and each reaches the
// mocked client at import.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    npc: { findMany },
    deities: { findMany },
    magicitems: { findMany },
    treasure: { findMany },
    faction: { findMany },
    dhDomain: { findMany },
  },
}));

import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredTreasures } from "@/app/lib/data/treasure/fetchFilteredTreasures";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import { fetchFilteredDhDomains } from "@/app/lib/data/dhDomains/fetchFilteredDhDomains";

const image = {
  displayKey: "display-key.webp",
  thumbKey: "thumb-key.webp",
  width: 800,
  height: 600,
};

function validRow(pageType: PageType): Record<string, unknown> {
  const row: Record<string, unknown> = { id: 1 };
  for (const key of entityFieldKeys(pageType)) {
    row[key] = fieldMeta[key]?.defaultValue;
  }
  return row;
}

/**
 * SPEC-020 T4: every list/card read of a domain with an image carries the
 * image's keys in the same query — one join, not one lookup per row — and
 * they survive the result parse to reach the cards and rows.
 */
describe.each([
  [PageType.Npc, fetchFilteredNpc],
  [PageType.Deity, fetchFilteredDeities],
  [PageType.MagicItem, fetchFilteredMagicItems],
  [PageType.Treasure, fetchFilteredTreasures],
  [PageType.Faction, fetchFilteredFactions],
  [PageType.DhDomain, fetchFilteredDhDomains],
] as const)("%s's list fetch", (pageType, fetch) => {
  beforeEach(() => findMany.mockReset());

  it("selects the image relation's keys in the row query", async () => {
    findMany.mockResolvedValue([]);

    await fetch(Promise.resolve({}));

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]![0]).toMatchObject({
      include: {
        image: {
          select: {
            displayKey: true,
            thumbKey: true,
            width: true,
            height: true,
          },
        },
      },
    });
  });

  it("returns the keys with the row", async () => {
    findMany.mockResolvedValue([
      { ...validRow(pageType), image },
      { ...validRow(pageType), id: 2, image: null },
    ]);

    const rows = (await fetch(Promise.resolve({}))) as Array<{
      image?: unknown;
    }>;

    expect(rows[0]?.image).toEqual(image);
    expect(rows[1]?.image).toBeNull();
  });
});
