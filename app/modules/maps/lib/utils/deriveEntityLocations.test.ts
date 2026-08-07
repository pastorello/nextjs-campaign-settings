import { describe, expect, it } from "vitest";

import deriveEntityLocations from "./deriveEntityLocations";

describe("deriveEntityLocations", () => {
  it("resolves an entity's location to its pin's parent title", () => {
    const rows = [
      {
        id: 1,
        title: "Skreebars",
        parentId: null,
        linkedType: null,
        linkedId: null,
      },
      {
        id: 2,
        title: "Dexter Nemrod",
        parentId: 1,
        linkedType: "npc",
        linkedId: 42,
      },
    ];

    expect(deriveEntityLocations(rows, "npc")).toEqual(
      new Map([[42, "Skreebars"]])
    );
  });

  it("only resolves entities of the requested linkedType", () => {
    const rows = [
      {
        id: 1,
        title: "Cieli",
        parentId: null,
        linkedType: null,
        linkedId: null,
      },
      { id: 2, title: "Helios", parentId: 1, linkedType: "deity", linkedId: 7 },
      { id: 3, title: "Dexter", parentId: 1, linkedType: "npc", linkedId: 42 },
    ];

    expect(deriveEntityLocations(rows, "deity")).toEqual(
      new Map([[7, "Cieli"]])
    );
    expect(deriveEntityLocations(rows, "npc")).toEqual(
      new Map([[42, "Cieli"]])
    );
  });

  it("omits an entity whose pin has no parent (the universe root itself)", () => {
    const rows = [
      {
        id: 1,
        title: "Universo",
        parentId: null,
        linkedType: "npc",
        linkedId: 1,
      },
    ];

    expect(deriveEntityLocations(rows, "npc")).toEqual(new Map());
  });

  it("omits an entity whose pin's parent no longer exists", () => {
    const rows = [
      { id: 2, title: "Dexter", parentId: 99, linkedType: "npc", linkedId: 42 },
    ];

    expect(deriveEntityLocations(rows, "npc")).toEqual(new Map());
  });

  it("returns an empty map when nobody of that type is pinned", () => {
    const rows = [
      {
        id: 1,
        title: "Skreebars",
        parentId: null,
        linkedType: null,
        linkedId: null,
      },
    ];

    expect(deriveEntityLocations(rows, "deity")).toEqual(new Map());
  });
});
