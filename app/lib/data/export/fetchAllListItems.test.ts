import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

const { fetchListItems } = vi.hoisted(() => ({ fetchListItems: vi.fn() }));
vi.mock("@/app/lib/data/lists/fetchListItems", () => ({
  default: fetchListItems,
}));

import fetchAllListItems from "./fetchAllListItems";

const rows = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: from + index }));

describe("fetchAllListItems (SPEC-033 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads every page until one comes back empty", async () => {
    fetchListItems
      .mockResolvedValueOnce(rows(1, 30))
      .mockResolvedValueOnce(rows(31, 30))
      .mockResolvedValueOnce(rows(61, 4))
      .mockResolvedValueOnce([]);

    const items = await fetchAllListItems(PageType.Spell, {});

    expect(items.map((item) => item.id)).toEqual(rows(1, 64).map((r) => r.id));
    expect(fetchListItems).toHaveBeenCalledTimes(4);
  });

  it("keeps the list's filter on every page, over any page it was given", async () => {
    fetchListItems.mockResolvedValueOnce(rows(1, 2)).mockResolvedValueOnce([]);

    await fetchAllListItems(PageType.Npc, { query: "guard", page: "3" });

    expect(fetchListItems).toHaveBeenNthCalledWith(1, PageType.Npc, {
      query: "guard",
      page: "1",
    });
    expect(fetchListItems).toHaveBeenNthCalledWith(2, PageType.Npc, {
      query: "guard",
      page: "2",
    });
  });

  it("returns nothing for an empty list, after one read", async () => {
    fetchListItems.mockResolvedValueOnce([]);

    expect(await fetchAllListItems(PageType.Faction, {})).toEqual([]);
    expect(fetchListItems).toHaveBeenCalledTimes(1);
  });

  it("stops, loudly, if a reader never runs out of pages", async () => {
    fetchListItems.mockResolvedValue(rows(1, 1));

    await expect(fetchAllListItems(PageType.Spell, {})).rejects.toThrow(
      /after 1000 pages/
    );
  });
});
