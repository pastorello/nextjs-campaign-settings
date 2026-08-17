import { beforeEach, describe, expect, it, vi } from "vitest";

const { zoneFindMany } = vi.hoisted(() => ({
  zoneFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findMany: zoneFindMany },
  },
}));

import fetchPlaceAncestryChain from "./fetchPlaceAncestryChain";

const terra = {
  id: 1,
  title: "Terra",
  parentId: null,
  mapImage: "terra.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
};
const kang = {
  id: 2,
  title: "Kingdom of Kang",
  parentId: 1,
  mapImage: "kang.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
};
const skreebars = {
  id: 3,
  title: "Skreebars",
  parentId: 2,
  mapImage: "skreebars.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
};

describe("fetchPlaceAncestryChain (SPEC-011 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the full root-to-place chain, nearest (the place itself) last, for a nested place", async () => {
    zoneFindMany.mockResolvedValue([terra, kang, skreebars]);

    const chain = await fetchPlaceAncestryChain(3);

    expect(chain?.map((zone) => zone.title)).toEqual([
      "Terra",
      "Kingdom of Kang",
      "Skreebars",
    ]);
  });

  it("returns a chain of one for the root itself", async () => {
    zoneFindMany.mockResolvedValue([terra, kang, skreebars]);

    const chain = await fetchPlaceAncestryChain(1);

    expect(chain?.map((zone) => zone.title)).toEqual(["Terra"]);
  });

  it("returns null when the id does not resolve to any zone", async () => {
    zoneFindMany.mockResolvedValue([terra, kang, skreebars]);

    const chain = await fetchPlaceAncestryChain(999);

    expect(chain).toBeNull();
  });

  it("stops at a broken parentId chain rather than hanging", async () => {
    // kangBroken points at a parentId (99) that doesn't exist in the table —
    // the same "stops there rather than throwing" rule deriveEntityAncestry
    // follows.
    const kangBroken = { ...kang, parentId: 99 };
    zoneFindMany.mockResolvedValue([kangBroken, skreebars]);

    const chain = await fetchPlaceAncestryChain(3);

    expect(chain?.map((zone) => zone.title)).toEqual([
      "Kingdom of Kang",
      "Skreebars",
    ]);
  });

  it("stops at a cyclic parentId chain rather than hanging", async () => {
    // a -> b -> a, a genuine cycle that must never be written but must not
    // hang a render if it somehow occurs.
    const a = { ...terra, id: 10, parentId: 11 };
    const b = { ...kang, id: 11, parentId: 10 };
    zoneFindMany.mockResolvedValue([a, b]);

    const chain = await fetchPlaceAncestryChain(10);

    expect(chain?.map((zone) => zone.id)).toEqual([11, 10]);
  });

  it("wraps a query failure as a DatabaseError", async () => {
    zoneFindMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchPlaceAncestryChain(1)).rejects.toThrow();
  });
});
