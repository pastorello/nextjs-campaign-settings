import { beforeEach, describe, expect, it, vi } from "vitest";

const { spells, magicitems, npc, deities, faction, zone, inSystem } =
  vi.hoisted(() => ({
    spells: { findMany: vi.fn() },
    magicitems: { findMany: vi.fn() },
    npc: { findMany: vi.fn() },
    deities: { findMany: vi.fn() },
    faction: { findMany: vi.fn() },
    zone: { findMany: vi.fn() },
    inSystem: vi.fn(),
  }));

vi.mock("@/app/lib/connections/prisma", () => ({
  default: { spells, magicitems, npc, deities, faction, zone },
}));
vi.mock("@/app/lib/data/search/searchAllDomains", () => ({
  isSearchDomainInSystem: inSystem,
}));

import fetchRecordLinkTargets from "./fetchRecordLinkTargets";

const link = (domain: string, id: number, text = "x") =>
  `<a data-record-domain="${domain}" data-record-id="${id}">${text}</a>`;

describe("fetchRecordLinkTargets (SPEC-019 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inSystem.mockReturnValue(true);
    for (const model of [spells, magicitems, npc, deities, faction, zone]) {
      model.findMany.mockResolvedValue([]);
    }
  });

  it("issues no query when nothing links", async () => {
    await expect(
      fetchRecordLinkTargets(
        ["plain text", null, undefined, "<p>no links</p>"],
        "dnd5e"
      )
    ).resolves.toEqual({});
    expect(npc.findMany).not.toHaveBeenCalled();
    expect(zone.findMany).not.toHaveBeenCalled();
  });

  it("batches one query per linked domain across every value", async () => {
    npc.findMany.mockResolvedValue([
      { id: 1, name: "Mira" },
      { id: 2, name: "Tobin" },
    ]);
    zone.findMany.mockResolvedValue([{ id: 9, title: "Aerivel" }]);

    const targets = await fetchRecordLinkTargets(
      [
        `<p>${link("npc", 1)} and ${link("npc", 2)}</p>`,
        `<ul><li>${link("npc", 1)}</li><li>${link("places", 9)}</li></ul>`,
      ],
      "dnd5e"
    );

    expect(npc.findMany).toHaveBeenCalledTimes(1);
    expect(npc.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      select: { id: true, name: true },
    });
    expect(zone.findMany).toHaveBeenCalledWith({
      where: { id: { in: [9] } },
      select: { id: true, title: true },
    });
    expect(spells.findMany).not.toHaveBeenCalled();
    expect(targets).toEqual({
      "npc:1": "Mira",
      "npc:2": "Tobin",
      "places:9": "Aerivel",
    });
  });

  it("leaves a deleted record out, so its link renders as text", async () => {
    deities.findMany.mockResolvedValue([{ id: 4, name: "Solan" }]);

    const targets = await fetchRecordLinkTargets(
      [`<p>${link("deities", 4)} ${link("deities", 5)}</p>`],
      "dnd5e"
    );

    expect(targets).toEqual({ "deities:4": "Solan" });
  });

  it("skips domains outside the route's game system", async () => {
    inSystem.mockImplementation((domain: string) => domain !== "spells");
    faction.findMany.mockResolvedValue([{ id: 3, name: "Guild" }]);

    const targets = await fetchRecordLinkTargets(
      [`<p>${link("spells", 1)} ${link("factions", 3)}</p>`],
      "otherSystem"
    );

    expect(spells.findMany).not.toHaveBeenCalled();
    expect(inSystem).toHaveBeenCalledWith("spells", "otherSystem");
    expect(targets).toEqual({ "factions:3": "Guild" });
  });

  it("ignores links the sanitiser would drop", async () => {
    await fetchRecordLinkTargets(
      [
        `<p>${link("users", 1)} <a data-record-domain="npc" data-record-id="0">x</a></p>`,
      ],
      "dnd5e"
    );

    expect(npc.findMany).not.toHaveBeenCalled();
  });

  it("wraps a database failure", async () => {
    magicitems.findMany.mockRejectedValue(new Error("down"));

    await expect(
      fetchRecordLinkTargets([`<p>${link("magicItems", 1)}</p>`], "dnd5e")
    ).rejects.toThrow(/resolving record links/);
  });
});
