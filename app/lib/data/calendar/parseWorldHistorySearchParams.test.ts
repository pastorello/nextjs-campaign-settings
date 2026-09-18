import { describe, expect, it } from "vitest";

import parseWorldHistorySearchParams from "./parseWorldHistorySearchParams";

describe("parseWorldHistorySearchParams (SPEC-014 T5)", () => {
  it("reads every filter and the page", () => {
    expect(
      parseWorldHistorySearchParams({
        place: "3",
        npc: "4",
        deity: "5",
        faction: "6",
        page: "2",
      })
    ).toEqual({ place: 3, npc: 4, deity: 5, faction: 6, page: 2 });
  });

  it("reads an empty URL as no filters on the first page", () => {
    expect(parseWorldHistorySearchParams({})).toEqual({
      place: null,
      npc: null,
      deity: null,
      faction: null,
      page: 1,
    });
  });

  it.each(["0", "-2", "abc", "1.5", ""])(
    "reads a malformed value %j as absent",
    (value) => {
      const query = parseWorldHistorySearchParams({
        place: value,
        page: value,
      });

      expect(query.place).toBeNull();
      expect(query.page).toBe(1);
    }
  );

  it("takes the first of a repeated parameter", () => {
    expect(parseWorldHistorySearchParams({ npc: ["7", "8"] }).npc).toBe(7);
  });
});
