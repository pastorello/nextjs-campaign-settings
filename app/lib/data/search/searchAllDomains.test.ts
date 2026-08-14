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

import searchAllDomains, { SEARCH_RESULT_CAP } from "./searchAllDomains";

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
    const result = await searchAllDomains("");

    expect(result.spells).toEqual({ total: 0, items: [] });
    expect(result.places).toEqual({ total: 0, items: [] });
    expect(fetchFilteredSpells).not.toHaveBeenCalled();
    expect(searchPlacesByTitle).not.toHaveBeenCalled();
  });

  it("returns all-empty groups when a term matches nothing", async () => {
    const result = await searchAllDomains("nonexistent");

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

    const result = await searchAllDomains("Skreebars");

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

    const result = await searchAllDomains("Spell");

    expect(result.spells.total).toBe(8);
    expect(result.spells.items).toHaveLength(SEARCH_RESULT_CAP);
    expect(result.spells.items).toEqual(
      spells.slice(0, SEARCH_RESULT_CAP).map(({ id, name }) => ({ id, name }))
    );
  });

  it("returns a matching place in the Places group", async () => {
    searchPlacesByTitle.mockResolvedValue([{ id: 3, title: "Aerivel" }]);

    const result = await searchAllDomains("Aeri");

    expect(result.places).toEqual({
      total: 1,
      items: [{ id: 3, name: "Aerivel" }],
    });
    expect(searchPlacesByTitle).toHaveBeenCalledWith("Aeri");
  });
});
