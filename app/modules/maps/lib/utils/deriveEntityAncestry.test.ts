import { describe, expect, it } from "vitest";

import deriveEntityAncestry, {
  findAncestorOfKind,
  toDerivedPlacements,
} from "./deriveEntityAncestry";

// The tree SPEC-004 T3 originally seeded, trimmed to what these cases need:
// root -> Cieli (plane) -> Paradiso, and root -> Terra (plane) -> Regno di
// Kang (region) -> Skreebars (city).
const zones = [
  { id: 1, title: "Universo", kind: "region", parentId: null },
  { id: 2, title: "Cieli", kind: "plane", parentId: 1 },
  { id: 3, title: "Paradiso", kind: "region", parentId: 2 },
  { id: 4, title: "Terra", kind: "plane", parentId: 1 },
  { id: 5, title: "Regno di Kang", kind: "region", parentId: 4 },
  { id: 6, title: "Skreebars", kind: "city", parentId: 5 },
];

const pois = [{ id: 100, title: "Locanda del Cinghiale Rosso", zoneId: 6 }];

describe("deriveEntityAncestry", () => {
  it("returns every ancestor of an entity's zone, nearest first", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 6, poiId: null },
    ]);

    expect(ancestry.get(42)?.map((place) => place.title)).toEqual([
      "Skreebars",
      "Regno di Kang",
      "Terra",
      "Universo",
    ]);
  });

  it("puts the landmark's own title first when poiId is set", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 6, poiId: 100 },
    ]);

    expect(ancestry.get(42)?.map((place) => place.title)).toEqual([
      "Locanda del Cinghiale Rosso",
      "Skreebars",
      "Regno di Kang",
      "Terra",
      "Universo",
    ]);
  });

  it("gives a single-entry chain for an entity assigned directly to the root", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 1, poiId: null },
    ]);

    expect(ancestry.get(42)).toEqual([
      { id: 1, title: "Universo", kind: "region" },
    ]);
  });

  it("omits an entity with no zoneId at all", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: null, poiId: null },
    ]);

    expect(ancestry.has(42)).toBe(false);
  });

  it("stops at a zoneId that does not exist, rather than throwing", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 999, poiId: null },
    ]);

    expect(ancestry.get(42)).toEqual([]);
  });

  it("stops the walk at a parentId that no longer exists", () => {
    const orphanZones = [
      { id: 6, title: "Skreebars", kind: "city", parentId: 999 },
    ];
    const ancestry = deriveEntityAncestry(
      orphanZones,
      [],
      [{ id: 42, zoneId: 6, poiId: null }]
    );

    expect(ancestry.get(42)).toEqual([
      { id: 6, title: "Skreebars", kind: "city" },
    ]);
  });

  it("terminates on a cycle instead of walking forever", () => {
    // Postgres permits this on a self-referencing FK even though the
    // mutation boundary rejects it — a corrupt row must not hang a render.
    const cyclicZones = [
      { id: 1, title: "A", kind: "region", parentId: 2 },
      { id: 2, title: "B", kind: "region", parentId: 1 },
    ];

    const ancestry = deriveEntityAncestry(
      cyclicZones,
      [],
      [{ id: 42, zoneId: 1, poiId: null }]
    );

    expect(ancestry.get(42)?.length).toBe(2);
  });
});

describe("findAncestorOfKind", () => {
  it("finds the plane, which is not positionally the second ancestor", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 6, poiId: null },
    ]);

    // Chain is Skreebars, Regno di Kang, Terra, Universo — the plane is
    // third, not second.
    expect(findAncestorOfKind(ancestry.get(42), "plane")?.title).toBe("Terra");
  });

  it("finds a deity's plane one step above its place", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 7, zoneId: 3, poiId: null },
    ]);

    expect(ancestry.get(7)?.[0]?.title).toBe("Paradiso");
    expect(findAncestorOfKind(ancestry.get(7), "plane")?.title).toBe("Cieli");
  });

  it("returns undefined when no ancestor has that kind, and for no chain", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 7, zoneId: 3, poiId: null },
    ]);

    expect(findAncestorOfKind(ancestry.get(7), "dungeon")).toBeUndefined();
    expect(findAncestorOfKind(undefined, "plane")).toBeUndefined();
  });
});

describe("toDerivedPlacements", () => {
  it("reduces a deity's chain to its place and the plane above it", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 7, zoneId: 3, poiId: null },
    ]);

    expect(toDerivedPlacements(ancestry)).toEqual({
      7: { place: "Paradiso", plane: "Cieli" },
    });
  });

  it("finds the plane however deep it sits in the chain", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 6, poiId: null },
    ]);

    expect(toDerivedPlacements(ancestry)).toEqual({
      42: { place: "Skreebars", plane: "Terra" },
    });
  });

  it("gives the root's own title as place, and null for plane, when assigned to the root", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: 1, poiId: null },
    ]);

    expect(toDerivedPlacements(ancestry)).toEqual({
      42: { place: "Universo", plane: null },
    });
  });

  it("omits a record with no zoneId, rather than giving it null entries", () => {
    const ancestry = deriveEntityAncestry(zones, pois, [
      { id: 42, zoneId: null, poiId: null },
    ]);

    expect(toDerivedPlacements(ancestry)).toEqual({});
  });
});
