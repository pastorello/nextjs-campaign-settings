import { describe, expect, it } from "vitest";

import {
  computeVisiblePlaces,
  hidingAncestor,
  type PlaceTree,
} from "./placeTree";

const A = 1; // a campaign
const B = 2; // another

// World (A, B) ─ Kingdom (A) ─ City (A, B) ─ Inn landmark (A, B)
//             └ Wilds (B)   ─ Cave landmark (A)
function tree(): PlaceTree {
  return {
    zones: new Map([
      [1, { parentId: null, title: "World", revealedTo: new Set([A, B]) }],
      [2, { parentId: 1, title: "Kingdom", revealedTo: new Set([A]) }],
      [3, { parentId: 2, title: "City", revealedTo: new Set([A, B]) }],
      [4, { parentId: 1, title: "Wilds", revealedTo: new Set([B]) }],
    ]),
    pois: new Map([
      [10, { zoneId: 3, title: "Inn", revealedTo: new Set([A, B]) }],
      [11, { zoneId: 4, title: "Cave", revealedTo: new Set([A]) }],
    ]),
  };
}

describe("computeVisiblePlaces (SPEC-022 §5, inheritance)", () => {
  it("shows a place whose whole ancestry is revealed", () => {
    const visible = computeVisiblePlaces(tree(), A);

    expect([...visible.zones].sort()).toEqual([1, 2, 3]);
    expect([...visible.pois]).toEqual([10]);
  });

  it("hides a revealed place under a hidden ancestor", () => {
    // City and the Inn are revealed to B, but the Kingdom is not.
    const visible = computeVisiblePlaces(tree(), B);

    expect([...visible.zones].sort()).toEqual([1, 4]);
    expect(visible.pois.has(10)).toBe(false);
  });

  it("hides a revealed landmark whose zone is hidden", () => {
    // The Cave is revealed to A; the Wilds are not.
    expect(computeVisiblePlaces(tree(), A).pois.has(11)).toBe(false);
  });

  it("shows nothing to a campaign the root is hidden from", () => {
    const visible = computeVisiblePlaces(tree(), 99);

    expect(visible.zones.size).toBe(0);
    expect(visible.pois.size).toBe(0);
  });

  it("hides a zone in a cycle rather than looping", () => {
    const looped: PlaceTree = {
      zones: new Map([
        [1, { parentId: 2, title: "A", revealedTo: new Set([A]) }],
        [2, { parentId: 1, title: "B", revealedTo: new Set([A]) }],
      ]),
      pois: new Map(),
    };

    expect(computeVisiblePlaces(looped, A).zones.size).toBe(0);
  });
});

describe("hidingAncestor", () => {
  it("names the nearest ancestor hiding the place", () => {
    expect(hidingAncestor(tree(), "zone", 3, B)).toBe("Kingdom");
    expect(hidingAncestor(tree(), "poi", 10, B)).toBe("Kingdom");
    expect(hidingAncestor(tree(), "poi", 11, A)).toBe("Wilds");
  });

  it("is null when every ancestor is revealed, or there is none", () => {
    expect(hidingAncestor(tree(), "zone", 3, A)).toBeNull();
    expect(hidingAncestor(tree(), "zone", 1, 99)).toBeNull();
  });
});
