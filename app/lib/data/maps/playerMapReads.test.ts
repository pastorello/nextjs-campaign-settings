import { beforeEach, describe, expect, it, vi } from "vitest";

const { scope, db } = vi.hoisted(() => ({
  scope: vi.fn(),
  db: {
    zone: { findMany: vi.fn() },
    poi: { findMany: vi.fn() },
    npc: { findMany: vi.fn() },
    deities: { findMany: vi.fn() },
  },
}));
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: scope,
}));
vi.mock("@/app/lib/connections/prisma", () => ({ default: db }));

import fetchPlaceChildren from "./fetchPlaceChildren";
import fetchEntitiesAtPlace from "./fetchEntitiesAtPlace";

const zone = (id: number) => ({
  id,
  title: `Zone ${id}`,
  description: null,
  kind: "region",
  lat: 1,
  lng: 1,
  mapImage: null,
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  footprint: null,
  gridColumns: null,
  gridScale: null,
  imageId: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});
const poi = (id: number) => ({
  id,
  title: `Landmark ${id}`,
  description: null,
  lat: 1,
  lng: 1,
  category: "inn",
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const playerScope = {
  kind: "campaign" as const,
  campaignId: 4,
  zones: new Set([1, 2]),
  pois: new Set([10]),
};

/** SPEC-022 T7 (R8, R9): the map's reads under a player's scope. */
describe("the map's reads for a player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.mockResolvedValue(playerScope);
    db.zone.findMany.mockResolvedValue([zone(2), zone(3)]);
    db.poi.findMany.mockResolvedValue([poi(10), poi(11)]);
    db.npc.findMany.mockResolvedValue([]);
    db.deities.findMany.mockResolvedValue([]);
  });

  it("lists only the visible children of a visible place", async () => {
    const children = await fetchPlaceChildren(1);

    expect(children.map(({ id, kind }) => [kind, id])).toEqual([
      ["region", 2],
      ["poi", 10],
    ]);
  });

  it("lists nothing under a hidden place, without reading it", async () => {
    await expect(fetchPlaceChildren(3)).resolves.toEqual([]);
    expect(db.zone.findMany).not.toHaveBeenCalled();
  });

  it("lists every child for the DM", async () => {
    scope.mockResolvedValue({ kind: "all" });

    await expect(fetchPlaceChildren(1)).resolves.toHaveLength(4);
  });

  it("lists only the revealed entities of a visible place", async () => {
    await fetchEntitiesAtPlace({ zoneId: 2 });

    expect(db.npc.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          zoneId: 2,
          poiId: null,
          revealedTo: { some: { id: 4 } },
        },
      })
    );
  });

  it("lists no entity at a hidden landmark", async () => {
    await expect(fetchEntitiesAtPlace({ poiId: 11 })).resolves.toEqual([]);
    expect(db.npc.findMany).not.toHaveBeenCalled();
  });
});
