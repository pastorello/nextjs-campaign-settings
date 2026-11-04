import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

const fetchers = vi.hoisted(() => ({
  fetchFilteredDeities: vi.fn(),
  fetchFilteredMagicItems: vi.fn(),
  fetchFilteredNpc: vi.fn(),
  fetchFilteredSpells: vi.fn(),
  fetchFilteredFactions: vi.fn(),
  fetchFilteredTreasures: vi.fn(),
  fetchFilteredDhDomains: vi.fn(),
  fetchFilteredDhDomainCards: vi.fn(),
  fetchFilteredDhClasses: vi.fn(),
  fetchFilteredDhSubclasses: vi.fn(),
  fetchFilteredDhAncestries: vi.fn(),
  fetchFilteredDhCommunities: vi.fn(),
  fetchFilteredDhAdversaries: vi.fn(),
  fetchFilteredDhEnvironments: vi.fn(),
  fetchFilteredDhWeapons: vi.fn(),
  fetchFilteredDhArmor: vi.fn(),
  fetchFilteredDhLoot: vi.fn(),
}));
vi.mock("@/app/lib/data/deities/fetchFilteredDeities", () => ({
  fetchFilteredDeities: fetchers.fetchFilteredDeities,
}));
vi.mock("@/app/lib/data/magicitems/fetchFilteredMagicItems", () => ({
  fetchFilteredMagicItems: fetchers.fetchFilteredMagicItems,
}));
vi.mock("@/app/lib/data/npc/fetchFilteredNpc", () => ({
  fetchFilteredNpc: fetchers.fetchFilteredNpc,
}));
vi.mock("@/app/lib/data/spells/fetchFilteredSpells", () => ({
  fetchFilteredSpells: fetchers.fetchFilteredSpells,
}));
vi.mock("@/app/lib/data/faction/fetchFilteredFactions", () => ({
  fetchFilteredFactions: fetchers.fetchFilteredFactions,
}));
vi.mock("@/app/lib/data/treasure/fetchFilteredTreasures", () => ({
  fetchFilteredTreasures: fetchers.fetchFilteredTreasures,
}));
vi.mock("@/app/lib/data/dhDomains/fetchFilteredDhDomains", () => ({
  fetchFilteredDhDomains: fetchers.fetchFilteredDhDomains,
}));
vi.mock("@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards", () => ({
  fetchFilteredDhDomainCards: fetchers.fetchFilteredDhDomainCards,
}));
vi.mock("@/app/lib/data/dhClasses/fetchFilteredDhClasses", () => ({
  fetchFilteredDhClasses: fetchers.fetchFilteredDhClasses,
}));
vi.mock("@/app/lib/data/dhSubclasses/fetchFilteredDhSubclasses", () => ({
  fetchFilteredDhSubclasses: fetchers.fetchFilteredDhSubclasses,
}));
vi.mock("@/app/lib/data/dhAncestries/fetchFilteredDhAncestries", () => ({
  fetchFilteredDhAncestries: fetchers.fetchFilteredDhAncestries,
}));
vi.mock("@/app/lib/data/dhCommunities/fetchFilteredDhCommunities", () => ({
  fetchFilteredDhCommunities: fetchers.fetchFilteredDhCommunities,
}));
vi.mock("@/app/lib/data/dhAdversaries/fetchFilteredDhAdversaries", () => ({
  fetchFilteredDhAdversaries: fetchers.fetchFilteredDhAdversaries,
}));
vi.mock("@/app/lib/data/dhEnvironments/fetchFilteredDhEnvironments", () => ({
  fetchFilteredDhEnvironments: fetchers.fetchFilteredDhEnvironments,
}));
vi.mock("@/app/lib/data/dhWeapons/fetchFilteredDhWeapons", () => ({
  fetchFilteredDhWeapons: fetchers.fetchFilteredDhWeapons,
}));
vi.mock("@/app/lib/data/dhArmor/fetchFilteredDhArmor", () => ({
  fetchFilteredDhArmor: fetchers.fetchFilteredDhArmor,
}));
vi.mock("@/app/lib/data/dhLoot/fetchFilteredDhLoot", () => ({
  fetchFilteredDhLoot: fetchers.fetchFilteredDhLoot,
}));

import fetchListItems from "./fetchListItems";

const readerOf: Record<PageType, keyof typeof fetchers> = {
  [PageType.Spell]: "fetchFilteredSpells",
  [PageType.Npc]: "fetchFilteredNpc",
  [PageType.Deity]: "fetchFilteredDeities",
  [PageType.MagicItem]: "fetchFilteredMagicItems",
  [PageType.Faction]: "fetchFilteredFactions",
  [PageType.Treasure]: "fetchFilteredTreasures",
  [PageType.DhDomain]: "fetchFilteredDhDomains",
  [PageType.DhDomainCard]: "fetchFilteredDhDomainCards",
  [PageType.DhClass]: "fetchFilteredDhClasses",
  [PageType.DhSubclass]: "fetchFilteredDhSubclasses",
  [PageType.DhAncestry]: "fetchFilteredDhAncestries",
  [PageType.DhCommunity]: "fetchFilteredDhCommunities",
  [PageType.DhAdversary]: "fetchFilteredDhAdversaries",
  [PageType.DhEnvironment]: "fetchFilteredDhEnvironments",
  [PageType.DhWeapon]: "fetchFilteredDhWeapons",
  [PageType.DhArmor]: "fetchFilteredDhArmor",
  [PageType.DhLoot]: "fetchFilteredDhLoot",
};

describe("fetchListItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const fetcher of Object.values(fetchers)) {
      fetcher.mockResolvedValue([]);
    }
  });

  // The admin list and SPEC-033's export both read through this switch: a
  // page type routed to another domain's reader would list, and export,
  // the wrong records without any error.
  it.each(Object.values(PageType))(
    "reads %s through its own domain's reader, with the params given",
    async (pageType) => {
      const rows = [{ id: 1, name: "row" }];
      fetchers[readerOf[pageType]].mockResolvedValue(rows);

      expect(await fetchListItems(pageType, { query: "q" })).toBe(rows);
      expect(fetchers[readerOf[pageType]]).toHaveBeenCalledWith({ query: "q" });
      for (const [name, fetcher] of Object.entries(fetchers)) {
        if (name !== readerOf[pageType]) {
          expect(fetcher).not.toHaveBeenCalled();
        }
      }
    }
  );
});
