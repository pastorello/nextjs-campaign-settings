import { describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import pagesConfig from "./pagesConfig";
import assertPageSystem from "./assertPageSystem";
import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import PageType from "@/app/lib/definitions/types/PageType";

describe("pagesConfig systems (ADR-0013 rule 4)", () => {
  it.each(Object.values(PageType))(
    "%s is either shared or belongs to exactly one declared system",
    (pageType) => {
      const { system } = pagesConfig[pageType];
      // `system` is a single optional value, so "more than one" is ruled out
      // by its type; what can still drift is a value outside the vocabulary.
      if (system !== undefined) expect(GAME_SYSTEMS).toContain(system);
    }
  );

  it("keeps the 5e catalogues in 5e and the world pages shared", () => {
    expect(pagesConfig[PageType.Spell].system).toBe("dnd5e");
    expect(pagesConfig[PageType.MagicItem].system).toBe("dnd5e");
    expect(pagesConfig[PageType.Treasure].system).toBe("dnd5e");
    expect(pagesConfig[PageType.Npc].system).toBeUndefined();
    expect(pagesConfig[PageType.Deity].system).toBeUndefined();
    expect(pagesConfig[PageType.Faction].system).toBeUndefined();
  });
});

describe("assertPageSystem", () => {
  it("lets a catalogue page through under its own system", () => {
    expect(() => assertPageSystem(PageType.Spell, "dnd5e")).not.toThrow();
  });

  it("is a 404 for a catalogue page under another system", () => {
    expect(() => assertPageSystem(PageType.Spell, "daggerheart")).toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it("lets a shared page through under any system", () => {
    expect(() => assertPageSystem(PageType.Npc, "daggerheart")).not.toThrow();
  });
});
