import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

import isPageInSystem from "./isPageInSystem";
import pagesConfig from "./pagesConfig";

describe("isPageInSystem (ADR-0013 rule 4)", () => {
  it("keeps a catalogue page to its own system", () => {
    expect(isPageInSystem(PageType.Spell, "dnd5e")).toBe(true);
    expect(isPageInSystem(PageType.Spell, "daggerheart")).toBe(false);
  });

  it("puts a shared page under every system", () => {
    expect(isPageInSystem(PageType.Npc, "dnd5e")).toBe(true);
    expect(isPageInSystem(PageType.Npc, "daggerheart")).toBe(true);
  });

  it.each(Object.values(PageType))(
    "agrees with pagesConfig's system for %s",
    (page) => {
      const own = pagesConfig[page].system;
      if (own === undefined) {
        expect(isPageInSystem(page, "anything")).toBe(true);
      } else {
        expect(isPageInSystem(page, own)).toBe(true);
        expect(isPageInSystem(page, `not-${own}`)).toBe(false);
      }
    }
  );
});
