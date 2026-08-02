import { describe, expect, it } from "vitest";

import filterByMeta from "./filterByMeta";
import Indexable from "@/app/lib/definitions/types/Indexable";

const items: Indexable[] = [
  { name: "Fireball", level: 3, classes: [1, 4] },
  { name: "Ice Storm", level: 4, classes: [1] },
  { name: "Magic Missile", level: 1, classes: [4] },
];

describe("filterByMeta", () => {
  it("returns the whole list when there is no search term or meta filter", () => {
    expect(filterByMeta(items, "", "name")).toEqual(items);
  });

  it("filters by a case-insensitive search term", () => {
    expect(filterByMeta(items, "fire", "name")).toEqual([items[0]]);
  });

  it("returns nothing when the search term matches no item", () => {
    expect(filterByMeta(items, "no-such-spell", "name")).toEqual([]);
  });

  it("filters by an array-type meta field", () => {
    const meta = [{ metaField: "classes", value: 4, fieldType: "array" }];

    expect(filterByMeta(items, "", "name", meta)).toEqual([items[0], items[2]]);
  });

  it("filters by a scalar meta field via equality", () => {
    const meta = [{ metaField: "level", value: 3, fieldType: "integer" }];

    expect(filterByMeta(items, "", "name", meta)).toEqual([items[0]]);
  });

  it("combines a search term with a meta filter — both must match", () => {
    const meta = [{ metaField: "classes", value: 1, fieldType: "array" }];

    expect(filterByMeta(items, "ice", "name", meta)).toEqual([items[1]]);
  });

  it("ignores a meta filter whose value is an empty array", () => {
    const meta = [{ metaField: "classes", value: [], fieldType: "array" }];

    expect(filterByMeta(items, "", "name", meta)).toEqual(items);
  });

  it("ignores a meta filter whose numeric value is below zero", () => {
    const meta = [{ metaField: "level", value: -1, fieldType: "integer" }];

    expect(filterByMeta(items, "", "name", meta)).toEqual(items);
  });

  it("treats a non-array, non-numeric field value as no match for an array filter", () => {
    const meta = [{ metaField: "name", value: 1, fieldType: "array" }];

    expect(filterByMeta(items, "", "name", meta)).toEqual([]);
  });

  it("defaults to the whole list when no meta argument is given", () => {
    expect(filterByMeta(items, "", "name", undefined)).toEqual(items);
  });
});
