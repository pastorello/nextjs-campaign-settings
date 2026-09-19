import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import richTextValuesOf from "./richTextValuesOf";

describe("richTextValuesOf (SPEC-019 T5)", () => {
  it("collects every formatted-text field of every row, in field order", () => {
    const rows = [
      { id: 1, name: "Fireball", description: "<p>Boom</p>", upcast: "More" },
      { id: 2, name: "Light", description: "Glow", upcast: null },
    ];

    expect(richTextValuesOf(PageType.Spell, rows)).toEqual([
      "<p>Boom</p>",
      "More",
      "Glow",
      null,
    ]);
  });

  it("reads the NPC's four character fields and its description", () => {
    const values = richTextValuesOf(PageType.Npc, [
      {
        name: "Mira",
        description: "d",
        appearance: "a",
        personality: "p",
        motivations: "m",
        secrets: "s",
      },
    ]);

    expect([...values].sort()).toEqual(["a", "d", "m", "p", "s"]);
  });

  it("returns nothing for a domain with no formatted text", () => {
    expect(richTextValuesOf(PageType.Deity, [{ name: "Ra" }])).toEqual([]);
  });
});
