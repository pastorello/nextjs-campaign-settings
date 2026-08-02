import { describe, expect, it } from "vitest";

import sortByField from ".";
import SortOrder from "@/app/lib/definitions/types/SortOrder";

describe("sortByField", () => {
  it("returns an empty array unchanged", () => {
    expect(sortByField([])).toEqual([]);
  });

  it("sorts a plain number array ascending by default", () => {
    expect(sortByField([3, 2, 1])).toEqual([1, 2, 3]);
  });

  it("sorts objects by a named field", () => {
    expect(sortByField([{ id: 3 }, { id: 2 }, { id: 1 }], "id")).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it("sorts descending when configured", () => {
    expect(sortByField([1, 2, 3], undefined, { order: SortOrder.desc })).toEqual([3, 2, 1]); // prettier-ignore
  });

  it("is case-insensitive by default", () => {
    expect(
      sortByField([{ name: "banana" }, { name: "Apple" }], "name")
    ).toEqual([{ name: "Apple" }, { name: "banana" }]);
  });

  it("respects case when isCaseSentitive is true", () => {
    expect(
      sortByField([{ name: "banana" }, { name: "Apple" }], "name", {
        isCaseSentitive: true,
      })
    ).toEqual([{ name: "Apple" }, { name: "banana" }]);
  });

  it("leaves equal elements in place", () => {
    expect(sortByField([2, 2, 1])).toEqual([1, 2, 2]);
  });

  it("sorts by a custom order given in sortedValues", () => {
    expect(
      sortByField(["low", "high", "medium"], undefined, {
        sortedValues: ["low", "medium", "high"],
      })
    ).toEqual(["low", "medium", "high"]);
  });

  it("passes non-array input through createEmptyArray", () => {
    expect(sortByField(null as unknown as number[])).toEqual([]);
  });
});
