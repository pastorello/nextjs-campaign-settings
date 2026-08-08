import { beforeEach, describe, expect, it, vi } from "vitest";

const { zoneFindMany, poiFindMany, npcFindMany, deitiesFindMany } = vi.hoisted(
  () => ({
    zoneFindMany: vi.fn(),
    poiFindMany: vi.fn(),
    npcFindMany: vi.fn(),
    deitiesFindMany: vi.fn(),
  })
);
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findMany: zoneFindMany },
    poi: { findMany: poiFindMany },
    npc: { findMany: npcFindMany },
    deities: { findMany: deitiesFindMany },
  },
}));

import fetchDerivedAncestry from "./fetchDerivedAncestry";

describe("fetchDerivedAncestry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    zoneFindMany.mockResolvedValue([
      { id: 1, title: "Terra", kind: "plane", parentId: null },
      { id: 2, title: "Skreebars", kind: "city", parentId: 1 },
    ]);
    poiFindMany.mockResolvedValue([]);
  });

  it("resolves an npc to its zone ancestor chain", async () => {
    npcFindMany.mockResolvedValue([{ id: 42, zoneId: 2, poiId: null }]);

    const result = await fetchDerivedAncestry("npc");

    expect(result.get(42)?.map((place) => place.title)).toEqual([
      "Skreebars",
      "Terra",
    ]);
    expect(deitiesFindMany).not.toHaveBeenCalled();
  });

  it("resolves a deity's landmark title as the immediate ancestor", async () => {
    poiFindMany.mockResolvedValue([{ id: 9, title: "Locanda", zoneId: 2 }]);
    deitiesFindMany.mockResolvedValue([{ id: 7, zoneId: 2, poiId: 9 }]);

    const result = await fetchDerivedAncestry("deity");

    expect(result.get(7)?.map((place) => place.title)).toEqual([
      "Locanda",
      "Skreebars",
      "Terra",
    ]);
    expect(npcFindMany).not.toHaveBeenCalled();
  });

  it("wraps a query failure as a DatabaseError", async () => {
    npcFindMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchDerivedAncestry("npc")).rejects.toThrow();
  });
});
