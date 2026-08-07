import { describe, expect, it } from "vitest";

import deriveEntityAncestry, {
  findAncestorOfKind,
  toDerivedPlacements,
} from "./deriveEntityAncestry";

// The tree SPEC-004 T3 actually seeded, trimmed to what these cases need:
// root region -> Cieli (plane) -> Paradiso, and root -> Terra (plane) ->
// Regno di Kang (region) -> Skreebars (city).
const world = [
  {
    id: 1,
    title: "Universo",
    kind: "region",
    parentId: null,
    linkedType: null,
    linkedId: null,
  },
  {
    id: 2,
    title: "Cieli",
    kind: "plane",
    parentId: 1,
    linkedType: null,
    linkedId: null,
  },
  {
    id: 3,
    title: "Paradiso",
    kind: "region",
    parentId: 2,
    linkedType: null,
    linkedId: null,
  },
  {
    id: 4,
    title: "Terra",
    kind: "plane",
    parentId: 1,
    linkedType: null,
    linkedId: null,
  },
  {
    id: 5,
    title: "Regno di Kang",
    kind: "region",
    parentId: 4,
    linkedType: null,
    linkedId: null,
  },
  {
    id: 6,
    title: "Skreebars",
    kind: "city",
    parentId: 5,
    linkedType: null,
    linkedId: null,
  },
];

const helios = {
  id: 10,
  title: "Helios",
  kind: "deity",
  parentId: 3,
  linkedType: "deity",
  linkedId: 7,
};
const dexter = {
  id: 11,
  title: "Dexter Nemrod",
  kind: "npc",
  parentId: 6,
  linkedType: "npc",
  linkedId: 42,
};

describe("deriveEntityAncestry", () => {
  it("returns every ancestor of a pin, nearest first", () => {
    const ancestry = deriveEntityAncestry([...world, dexter], "npc");

    expect(ancestry.get(42)?.map((place) => place.title)).toEqual([
      "Skreebars",
      "Regno di Kang",
      "Terra",
      "Universo",
    ]);
  });

  it("only resolves entities of the requested linkedType", () => {
    const rows = [...world, helios, dexter];

    expect([...deriveEntityAncestry(rows, "deity").keys()]).toEqual([7]);
    expect([...deriveEntityAncestry(rows, "npc").keys()]).toEqual([42]);
  });

  it("gives an empty chain — not an absent entry — for a pin at the root", () => {
    const rooted = { ...dexter, parentId: null };
    const ancestry = deriveEntityAncestry([...world, rooted], "npc");

    expect(ancestry.has(42)).toBe(true);
    expect(ancestry.get(42)).toEqual([]);
  });

  it("omits an entity that has no pin at all", () => {
    expect(deriveEntityAncestry(world, "npc").has(42)).toBe(false);
  });

  it("stops at a parent that no longer exists rather than throwing", () => {
    const orphan = { ...dexter, parentId: 999 };

    expect(deriveEntityAncestry([...world, orphan], "npc").get(42)).toEqual([]);
  });

  it("terminates on a cycle instead of walking forever", () => {
    // Postgres permits this on a self-referencing FK even though the
    // mutation boundary rejects it — a corrupt row must not hang a render.
    const cyclic = [
      {
        id: 1,
        title: "A",
        kind: "region",
        parentId: 2,
        linkedType: null,
        linkedId: null,
      },
      {
        id: 2,
        title: "B",
        kind: "region",
        parentId: 1,
        linkedType: null,
        linkedId: null,
      },
      {
        id: 3,
        title: "Pin",
        kind: "npc",
        parentId: 1,
        linkedType: "npc",
        linkedId: 42,
      },
    ];

    expect(deriveEntityAncestry(cyclic, "npc").get(42)?.length).toBe(2);
  });
});

describe("findAncestorOfKind", () => {
  it("finds the plane, which is not positionally the second ancestor", () => {
    const ancestry = deriveEntityAncestry([...world, helios, dexter], "npc");

    // Dexter's chain is Skreebars, Regno di Kang, Terra, Universo — the
    // plane is third, not second.
    expect(findAncestorOfKind(ancestry.get(42), "plane")?.title).toBe("Terra");
  });

  it("finds a deity's plane one step above its place", () => {
    const ancestry = deriveEntityAncestry([...world, helios], "deity");

    expect(ancestry.get(7)?.[0]?.title).toBe("Paradiso");
    expect(findAncestorOfKind(ancestry.get(7), "plane")?.title).toBe("Cieli");
  });

  it("returns undefined when no ancestor has that kind, and for no chain", () => {
    const ancestry = deriveEntityAncestry([...world, helios], "deity");

    expect(findAncestorOfKind(ancestry.get(7), "dungeon")).toBeUndefined();
    expect(findAncestorOfKind(undefined, "plane")).toBeUndefined();
  });
});

describe("toDerivedPlacements", () => {
  it("reduces a deity's chain to its place and the plane above it", () => {
    const ancestry = deriveEntityAncestry([...world, helios], "deity");

    expect(toDerivedPlacements(ancestry)).toEqual({
      7: { place: "Paradiso", plane: "Cieli" },
    });
  });

  it("finds the plane however deep it sits in the chain", () => {
    const ancestry = deriveEntityAncestry([...world, dexter], "npc");

    expect(toDerivedPlacements(ancestry)).toEqual({
      42: { place: "Skreebars", plane: "Terra" },
    });
  });

  it("gives both as null for a record pinned at the root", () => {
    const rooted = { ...dexter, parentId: null };
    const ancestry = deriveEntityAncestry([...world, rooted], "npc");

    expect(toDerivedPlacements(ancestry)).toEqual({
      42: { place: null, plane: null },
    });
  });

  it("omits a record with no pin, rather than giving it null entries", () => {
    expect(toDerivedPlacements(deriveEntityAncestry(world, "npc"))).toEqual({});
  });
});
