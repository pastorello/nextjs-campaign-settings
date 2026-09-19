import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchFilteredSpells } = vi.hoisted(() => ({
  fetchFilteredSpells: vi.fn(),
}));
const { fetchFilteredMagicItems } = vi.hoisted(() => ({
  fetchFilteredMagicItems: vi.fn(),
}));
const { fetchFilteredNpc } = vi.hoisted(() => ({ fetchFilteredNpc: vi.fn() }));
const { fetchFilteredDeities } = vi.hoisted(() => ({
  fetchFilteredDeities: vi.fn(),
}));
const { fetchFilteredFactions } = vi.hoisted(() => ({
  fetchFilteredFactions: vi.fn(),
}));
const { searchPlacesByTitle } = vi.hoisted(() => ({
  searchPlacesByTitle: vi.fn(),
}));

vi.mock("@/app/lib/data/spells/fetchFilteredSpells", () => ({
  fetchFilteredSpells,
}));
vi.mock("@/app/lib/data/magicitems/fetchFilteredMagicItems", () => ({
  fetchFilteredMagicItems,
}));
vi.mock("@/app/lib/data/npc/fetchFilteredNpc", () => ({ fetchFilteredNpc }));
vi.mock("@/app/lib/data/deities/fetchFilteredDeities", () => ({
  fetchFilteredDeities,
}));
vi.mock("@/app/lib/data/faction/fetchFilteredFactions", () => ({
  fetchFilteredFactions,
}));
vi.mock("@/app/lib/data/maps/searchPlacesByTitle", () => ({
  default: searchPlacesByTitle,
}));
const {
  fetchFilteredDhDomains,
  fetchFilteredDhDomainCards,
  fetchFilteredDhClasses,
  fetchFilteredDhSubclasses,
} = vi.hoisted(() => ({
  fetchFilteredDhDomains: vi.fn(),
  fetchFilteredDhDomainCards: vi.fn(),
  fetchFilteredDhClasses: vi.fn(),
  fetchFilteredDhSubclasses: vi.fn(),
}));
vi.mock("@/app/lib/data/dhDomains/fetchFilteredDhDomains", () => ({
  fetchFilteredDhDomains,
}));
vi.mock("@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards", () => ({
  fetchFilteredDhDomainCards,
}));
vi.mock("@/app/lib/data/dhClasses/fetchFilteredDhClasses", () => ({
  fetchFilteredDhClasses,
}));
vi.mock("@/app/lib/data/dhSubclasses/fetchFilteredDhSubclasses", () => ({
  fetchFilteredDhSubclasses,
}));

const DAGGERHEART_DOMAINS = [
  "dhDomains",
  "dhDomainCards",
  "dhClasses",
  "dhSubclasses",
] as const;
const DAGGERHEART_FETCHERS = [
  fetchFilteredDhDomains,
  fetchFilteredDhDomainCards,
  fetchFilteredDhClasses,
  fetchFilteredDhSubclasses,
];

import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import searchAllDomains, {
  SEARCH_DOMAINS,
  SEARCH_RESULT_CAP,
  isSearchDomainInSystem,
} from "./searchAllDomains";
import { RECORD_LINK_DOMAINS } from "@/app/lib/definitions/types/RecordLinkDomain";

describe("SEARCH_DOMAINS and formatted-text record links (ADR-0016)", () => {
  it("are the same list, so every searchable record can be linked", () => {
    expect([...RECORD_LINK_DOMAINS]).toEqual([...SEARCH_DOMAINS]);
  });
});

describe("searchAllDomains (SPEC-011 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFilteredSpells.mockResolvedValue([]);
    fetchFilteredMagicItems.mockResolvedValue([]);
    fetchFilteredNpc.mockResolvedValue([]);
    fetchFilteredDeities.mockResolvedValue([]);
    fetchFilteredFactions.mockResolvedValue([]);
    searchPlacesByTitle.mockResolvedValue([]);
  });

  it("returns all-empty groups without issuing any query for an empty term", async () => {
    const result = await searchAllDomains("", "dnd5e");

    expect(result.spells).toEqual({ total: 0, items: [] });
    expect(result.places).toEqual({ total: 0, items: [] });
    expect(fetchFilteredSpells).not.toHaveBeenCalled();
    expect(searchPlacesByTitle).not.toHaveBeenCalled();
  });

  it("returns all-empty groups when a term matches nothing", async () => {
    const result = await searchAllDomains("nonexistent", "dnd5e");

    expect(result.spells).toEqual({ total: 0, items: [] });
    expect(result.magicItems).toEqual({ total: 0, items: [] });
    expect(result.npc).toEqual({ total: 0, items: [] });
    expect(result.deities).toEqual({ total: 0, items: [] });
    expect(result.factions).toEqual({ total: 0, items: [] });
    expect(result.places).toEqual({ total: 0, items: [] });
  });

  it("returns both groups when a term matches two domains", async () => {
    fetchFilteredNpc.mockResolvedValue([
      { id: 1, name: "Skreebars", description: "" },
    ]);
    fetchFilteredDeities.mockResolvedValue([
      { id: 2, name: "Skreebars", deityTitle: "" },
    ]);

    const result = await searchAllDomains("Skreebars", "dnd5e");

    expect(result.npc).toEqual({
      total: 1,
      items: [{ id: 1, name: "Skreebars" }],
    });
    expect(result.deities).toEqual({
      total: 1,
      items: [{ id: 2, name: "Skreebars" }],
    });
    expect(fetchFilteredNpc).toHaveBeenCalledWith({ query: "Skreebars" });
    expect(fetchFilteredDeities).toHaveBeenCalledWith({ query: "Skreebars" });
  });

  it("caps a domain over the limit and reports the full total", async () => {
    const spells = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Spell ${i + 1}`,
    }));
    fetchFilteredSpells.mockResolvedValue(spells);

    const result = await searchAllDomains("Spell", "dnd5e");

    expect(result.spells.total).toBe(8);
    expect(result.spells.items).toHaveLength(SEARCH_RESULT_CAP);
    expect(result.spells.items).toEqual(
      spells.slice(0, SEARCH_RESULT_CAP).map(({ id, name }) => ({ id, name }))
    );
  });

  it("returns a matching place in the Places group", async () => {
    searchPlacesByTitle.mockResolvedValue([{ id: 3, title: "Aerivel" }]);

    const result = await searchAllDomains("Aeri", "dnd5e");

    expect(result.places).toEqual({
      total: 1,
      items: [{ id: 3, name: "Aerivel" }],
    });
    expect(searchPlacesByTitle).toHaveBeenCalledWith("Aeri");
  });
});

describe("searchAllDomains by game system (ADR-0013 rule 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFilteredSpells.mockResolvedValue([{ id: 1, name: "Fire Bolt" }]);
    fetchFilteredMagicItems.mockResolvedValue([{ id: 2, name: "Fire Wand" }]);
    fetchFilteredNpc.mockResolvedValue([{ id: 3, name: "Fire Priest" }]);
    fetchFilteredDeities.mockResolvedValue([{ id: 4, name: "Fire God" }]);
    fetchFilteredFactions.mockResolvedValue([{ id: 5, name: "Fire Guild" }]);
    searchPlacesByTitle.mockResolvedValue([{ id: 6, title: "Fire Peak" }]);
    // Invented names only (SPEC-018 §5).
    fetchFilteredDhDomains.mockResolvedValue([{ id: 7, name: "Firewright" }]);
    fetchFilteredDhDomainCards.mockResolvedValue([
      { id: 8, name: "Fire Step" },
    ]);
    fetchFilteredDhClasses.mockResolvedValue([{ id: 9, name: "Firekeeper" }]);
    fetchFilteredDhSubclasses.mockResolvedValue([
      { id: 10, name: "Fire Warden" },
    ]);
  });

  it("searches every domain but the Daggerheart catalogues under dnd5e", async () => {
    const result = await searchAllDomains("Fire", "dnd5e");
    for (const domain of SEARCH_DOMAINS) {
      expect(result[domain].total).toBe(
        (DAGGERHEART_DOMAINS as readonly string[]).includes(domain) ? 0 : 1
      );
    }
    for (const fetcher of DAGGERHEART_FETCHERS) {
      expect(fetcher).not.toHaveBeenCalled();
    }
  });

  it("finds the four Daggerheart catalogues under daggerheart (SPEC-021 T7)", async () => {
    const result = await searchAllDomains("Fire", "daggerheart");

    expect(result.dhDomains.items).toEqual([{ id: 7, name: "Firewright" }]);
    expect(result.dhDomainCards.items).toEqual([{ id: 8, name: "Fire Step" }]);
    expect(result.dhClasses.items).toEqual([{ id: 9, name: "Firekeeper" }]);
    expect(result.dhSubclasses.items).toEqual([
      { id: 10, name: "Fire Warden" },
    ]);
    for (const fetcher of DAGGERHEART_FETCHERS) {
      expect(fetcher).toHaveBeenCalledWith({ query: "Fire" });
    }
  });

  it("searches every world domain under every system", async () => {
    for (const system of GAME_SYSTEMS) {
      const result = await searchAllDomains("Fire", system);
      for (const domain of ["npc", "deities", "factions", "places"] as const) {
        expect(result[domain].total).toBe(1);
      }
    }
  });

  it("leaves another system's catalogues out, without querying them", async () => {
    const result = await searchAllDomains("Fire", "daggerheart");

    expect(result.spells).toEqual({ total: 0, items: [] });
    expect(result.magicItems).toEqual({ total: 0, items: [] });
    expect(fetchFilteredSpells).not.toHaveBeenCalled();
    expect(fetchFilteredMagicItems).not.toHaveBeenCalled();
  });

  it("always searches the shared world domains", async () => {
    const result = await searchAllDomains("Fire", "daggerheart");

    expect(result.npc.items).toEqual([{ id: 3, name: "Fire Priest" }]);
    expect(result.deities.items).toEqual([{ id: 4, name: "Fire God" }]);
    expect(result.factions.items).toEqual([{ id: 5, name: "Fire Guild" }]);
    expect(result.places.items).toEqual([{ id: 6, name: "Fire Peak" }]);
  });

  it("classifies catalogues by their page's system and the world as shared", () => {
    expect(isSearchDomainInSystem("spells", "dnd5e")).toBe(true);
    expect(isSearchDomainInSystem("spells", "daggerheart")).toBe(false);
    expect(isSearchDomainInSystem("magicItems", "daggerheart")).toBe(false);
    for (const domain of DAGGERHEART_DOMAINS) {
      expect(isSearchDomainInSystem(domain, "daggerheart")).toBe(true);
      expect(isSearchDomainInSystem(domain, "dnd5e")).toBe(false);
    }
    for (const domain of ["npc", "deities", "factions", "places"] as const) {
      expect(isSearchDomainInSystem(domain, "daggerheart")).toBe(true);
    }
  });
});
