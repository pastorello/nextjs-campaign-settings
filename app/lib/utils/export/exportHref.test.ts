import { describe, expect, it } from "vitest";

import exportHref from "./exportHref";
import PageType from "@/app/lib/definitions/types/PageType";

describe("exportHref (SPEC-033 T1)", () => {
  it("carries the list's filter and order, and the locale", () => {
    expect(
      exportHref(PageType.Spell, "en", {
        query: "fire",
        level: "3",
        sort: "desc",
      })
    ).toBe("/api/export/spells?query=fire&level=3&sort=desc&locale=en");
  });

  it("drops the page: the export holds every page", () => {
    expect(exportHref(PageType.Npc, "it", { page: "4", query: "x" })).toBe(
      "/api/export/npc?query=x&locale=it"
    );
  });

  it("names one record by id", () => {
    expect(exportHref(PageType.DhDomainCard, "it", { id: "7" })).toBe(
      "/api/export/domain-cards?id=7&locale=it"
    );
  });

  it("encodes what it carries, and lets the given locale win", () => {
    expect(
      exportHref(PageType.Faction, "it", {
        query: "a&b",
        locale: "en",
        empty: undefined,
      })
    ).toBe("/api/export/factions?query=a%26b&locale=it");
  });
});
