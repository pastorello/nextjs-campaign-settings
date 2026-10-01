import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  spells,
  magicitems,
  npc,
  deities,
  faction,
  zone,
  dhDomain,
  dhDomainCard,
  dhClass,
  dhSubclass,
  dhAncestry,
  dhCommunity,
  dhAdversary,
  dhEnvironment,
  dhWeapon,
  dhArmor,
  dhLoot,
  inSystem,
} = vi.hoisted(() => ({
  spells: { findMany: vi.fn() },
  magicitems: { findMany: vi.fn() },
  npc: { findMany: vi.fn() },
  deities: { findMany: vi.fn() },
  faction: { findMany: vi.fn() },
  zone: { findMany: vi.fn() },
  dhDomain: { findMany: vi.fn() },
  dhDomainCard: { findMany: vi.fn() },
  dhClass: { findMany: vi.fn() },
  dhSubclass: { findMany: vi.fn() },
  dhAncestry: { findMany: vi.fn() },
  dhCommunity: { findMany: vi.fn() },
  dhAdversary: { findMany: vi.fn() },
  dhEnvironment: { findMany: vi.fn() },
  dhWeapon: { findMany: vi.fn() },
  dhArmor: { findMany: vi.fn() },
  dhLoot: { findMany: vi.fn() },
  inSystem: vi.fn(),
}));

vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    spells,
    magicitems,
    npc,
    deities,
    faction,
    zone,
    dhDomain,
    dhDomainCard,
    dhClass,
    dhSubclass,
    dhAncestry,
    dhCommunity,
    dhAdversary,
    dhEnvironment,
    dhWeapon,
    dhArmor,
    dhLoot,
  },
}));
vi.mock("@/app/lib/data/search/searchAllDomains", () => ({
  isSearchDomainInSystem: inSystem,
  // The player cut has its own suite (`playerRecordLinks.test.ts`).
  isPlayerSearchDomain: () => true,
}));

import fetchRecordLinkTargets from "./fetchRecordLinkTargets";

const ALL = { kind: "all" } as const;

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
        "dnd5e",
        ALL
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
      "dnd5e",
      ALL
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
      "dnd5e",
      ALL
    );

    expect(targets).toEqual({ "deities:4": "Solan" });
  });

  it("skips domains outside the route's game system", async () => {
    inSystem.mockImplementation((domain: string) => domain !== "spells");
    faction.findMany.mockResolvedValue([{ id: 3, name: "Guild" }]);

    const targets = await fetchRecordLinkTargets(
      [`<p>${link("spells", 1)} ${link("factions", 3)}</p>`],
      "otherSystem",
      ALL
    );

    expect(spells.findMany).not.toHaveBeenCalled();
    expect(inSystem).toHaveBeenCalledWith("spells", "otherSystem");
    expect(targets).toEqual({ "factions:3": "Guild" });
  });

  it("resolves links to the four Daggerheart catalogues (SPEC-021 T7)", async () => {
    dhDomain.findMany.mockResolvedValue([{ id: 1, name: "Veilwright" }]);
    dhDomainCard.findMany.mockResolvedValue([{ id: 2, name: "Lantern Step" }]);
    dhClass.findMany.mockResolvedValue([{ id: 3, name: "Lamplighter" }]);
    dhSubclass.findMany.mockResolvedValue([{ id: 4, name: "Glass Warden" }]);

    const targets = await fetchRecordLinkTargets(
      [
        `<p>${link("dhDomains", 1)} ${link("dhDomainCards", 2)}</p>`,
        `<p>${link("dhClasses", 3)} ${link("dhSubclasses", 4)}</p>`,
      ],
      "daggerheart",
      ALL
    );

    expect(targets).toEqual({
      "dhDomains:1": "Veilwright",
      "dhDomainCards:2": "Lantern Step",
      "dhClasses:3": "Lamplighter",
      "dhSubclasses:4": "Glass Warden",
    });
  });

  it("resolves links to weapons, armor and loot (SPEC-029 T5)", async () => {
    dhWeapon.findMany.mockResolvedValue([{ id: 1, name: "Hook" }]);
    dhArmor.findMany.mockResolvedValue([{ id: 2, name: "Coat" }]);
    dhLoot.findMany.mockResolvedValue([{ id: 3, name: "Jar" }]);

    const targets = await fetchRecordLinkTargets(
      [
        `<p>${link("dhWeapons", 1)} ${link("dhArmor", 2)} ${link("dhLoot", 3)}</p>`,
      ],
      "daggerheart",
      ALL
    );

    expect(targets).toEqual({
      "dhWeapons:1": "Hook",
      "dhArmor:2": "Coat",
      "dhLoot:3": "Jar",
    });
  });

  it("resolves links to adversaries and environments (SPEC-028 T4)", async () => {
    dhAdversary.findMany.mockResolvedValue([{ id: 7, name: "Wraith" }]);
    dhEnvironment.findMany.mockResolvedValue([{ id: 8, name: "Market" }]);

    const targets = await fetchRecordLinkTargets(
      [`<p>${link("dhAdversaries", 7)} ${link("dhEnvironments", 8)}</p>`],
      "daggerheart",
      ALL
    );

    expect(targets).toEqual({
      "dhAdversaries:7": "Wraith",
      "dhEnvironments:8": "Market",
    });
  });

  it("resolves links to ancestries and communities (SPEC-027 T4)", async () => {
    dhAncestry.findMany.mockResolvedValue([{ id: 5, name: "Emberkin" }]);
    dhCommunity.findMany.mockResolvedValue([{ id: 6, name: "Valefolk" }]);

    const targets = await fetchRecordLinkTargets(
      [`<p>${link("dhAncestries", 5)} ${link("dhCommunities", 6)}</p>`],
      "daggerheart",
      ALL
    );

    expect(targets).toEqual({
      "dhAncestries:5": "Emberkin",
      "dhCommunities:6": "Valefolk",
    });
  });

  it("ignores links the sanitiser would drop", async () => {
    await fetchRecordLinkTargets(
      [
        `<p>${link("users", 1)} <a data-record-domain="npc" data-record-id="0">x</a></p>`,
      ],
      "dnd5e",
      ALL
    );

    expect(npc.findMany).not.toHaveBeenCalled();
  });

  it("wraps a database failure", async () => {
    magicitems.findMany.mockRejectedValue(new Error("down"));

    await expect(
      fetchRecordLinkTargets([`<p>${link("magicItems", 1)}</p>`], "dnd5e", ALL)
    ).rejects.toThrow(/resolving record links/);
  });
});
