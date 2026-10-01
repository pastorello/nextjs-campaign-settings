import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";

/**
 * SPEC-022 T8b: each read path of the four revealed domains, under a
 * player's scope (R2–R7). Campaign 7 sees zone 1 and landmark 20; zone 3
 * and landmark 21 are hidden from it.
 */
const PLAYER = {
  kind: "campaign" as const,
  campaignId: 7,
  zones: new Set([1]),
  pois: new Set([20]),
};
const REVEALED = { revealedTo: { some: { id: 7 } } };

vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve(PLAYER),
}));

const db = vi.hoisted(() => {
  const model = () => ({ findMany: vi.fn(), count: vi.fn() });
  return {
    npc: model(),
    deities: model(),
    magicitems: model(),
    faction: model(),
    zone: model(),
    poi: model(),
    treasure: model(),
    dhDomain: model(),
  };
});
vi.mock("@/app/lib/connections/prisma", () => ({ default: db }));

import { fetchFilteredNpc } from "../npc/fetchFilteredNpc";
import { getNpcCount } from "../npc/getNpcCount";
import { fetchFilteredDeities } from "../deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "../magicitems/fetchFilteredMagicItems";
import { fetchFilteredFactions } from "../faction/fetchFilteredFactions";
import fetchFactionRosters from "../faction/fetchFactionRosters";
import fetchDerivedAncestry from "../maps/fetchDerivedAncestry";
import fetchFieldOptions from "../options/fetchFieldOptions";

function rowOf(pageType: PageType, overrides: Record<string, unknown> = {}) {
  const row: Record<string, unknown> = { id: 1 };
  for (const key of entityFieldKeys(pageType)) {
    row[key] = fieldMeta[key]?.defaultValue;
  }
  return { ...row, ...overrides };
}

/** The `where` of the last `findMany` call on a model. */
function lastWhere(model: { findMany: ReturnType<typeof vi.fn> }) {
  return (model.findMany.mock.lastCall?.[0] as { where?: unknown }).where;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const model of Object.values(db)) {
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
  }
});

describe("R2 — the NPC list", () => {
  it("reads only the NPCs revealed to the campaign", async () => {
    await fetchFilteredNpc({});

    expect(lastWhere(db.npc)).toEqual({ AND: [{}, REVEALED] });
  });

  it("sends no DM-only value, and no campaign list", async () => {
    db.npc.findMany.mockResolvedValue([
      {
        ...rowOf(PageType.Npc, {
          motivations: "<p>gold</p>",
          secrets: "<p>traitor</p>",
        }),
        revealedTo: [{ id: 7 }, { id: 9 }],
      },
    ]);

    const [row] = await fetchFilteredNpc({});

    expect(row?.motivations).toBe("");
    expect(row?.secrets).toBe("");
    expect(row).toMatchObject({ revealedTo: [] });
  });

  it("reads a faction the campaign has not been shown as none", async () => {
    db.faction.findMany.mockResolvedValue([{ id: 2 }]);
    db.npc.findMany.mockResolvedValue([
      rowOf(PageType.Npc, { id: 1, faction: 2 }),
      rowOf(PageType.Npc, { id: 2, faction: 3 }),
    ]);

    const rows = await fetchFilteredNpc({});

    expect(rows.map((row) => row.faction)).toEqual([2, null]);
  });

  it("matches no one when filtered by a hidden faction", async () => {
    db.faction.findMany.mockResolvedValue([{ id: 2 }]);

    await fetchFilteredNpc({ faction: "3" });

    expect(lastWhere(db.npc)).toEqual({
      AND: [{ faction: { in: [] } }, REVEALED],
    });
  });

  it("ignores a filter or a sort on a secret", async () => {
    await fetchFilteredNpc({
      secrets: "traitor",
      sortFields: '{"secrets":"asc"}',
    });

    const args = db.npc.findMany.mock.lastCall?.[0] as {
      where: unknown;
      orderBy: unknown[];
    };
    expect(args.where).toEqual({ AND: [{}, REVEALED] });
    expect(JSON.stringify(args.orderBy)).not.toContain("secrets");
  });

  it("counts the revealed NPCs alone, in the total too", async () => {
    await getNpcCount({});

    expect(db.npc.count).toHaveBeenNthCalledWith(1, { where: REVEALED });
    expect(db.npc.count).toHaveBeenNthCalledWith(2, {
      where: { AND: [{}, REVEALED] },
    });
  });
});

describe("R3, R4, R5 — the deity, magic item and faction lists", () => {
  it.each([
    ["deities", () => fetchFilteredDeities({}), db.deities],
    ["magic items", () => fetchFilteredMagicItems({}), db.magicitems],
    ["factions", () => fetchFilteredFactions({}), db.faction],
  ])("reads only the %s revealed to the campaign", async (_, read, model) => {
    await read();

    expect(lastWhere(model)).toEqual({ AND: [{}, REVEALED] });
  });

  it("names only revealed members, of revealed factions", async () => {
    await fetchFactionRosters();

    expect(lastWhere(db.npc)).toEqual({
      faction: { not: null },
      ...REVEALED,
      factionRef: REVEALED,
    });
  });
});

describe("R6 — where a record is", () => {
  beforeEach(() => {
    db.zone.findMany.mockResolvedValue([
      { id: 1, title: "Aerivel", kind: "region", parentId: null },
      { id: 3, title: "Secret city", kind: "city", parentId: 1 },
    ]);
    db.poi.findMany.mockResolvedValue([
      { id: 20, title: "Tower", zoneId: 1 },
      { id: 21, title: "Crypt", zoneId: 1 },
    ]);
  });

  it("places only revealed records, and a hidden place reads as unknown", async () => {
    db.npc.findMany.mockResolvedValue([
      { id: 1, zoneId: 3, poiId: null },
      { id: 2, zoneId: 1, poiId: 21 },
      { id: 3, zoneId: 1, poiId: 20 },
    ]);

    const ancestry = await fetchDerivedAncestry("npc");

    expect(lastWhere(db.npc)).toEqual(REVEALED);
    expect(ancestry.has(1)).toBe(false);
    expect(ancestry.get(2)?.map(({ title }) => title)).toEqual(["Aerivel"]);
    expect(ancestry.get(3)?.map(({ title }) => title)).toEqual([
      "Tower",
      "Aerivel",
    ]);
    expect(JSON.stringify([...ancestry])).not.toMatch(/Secret city|Crypt/);
  });
});

describe("R7 — option lists", () => {
  it("offers only visible places", async () => {
    await fetchFieldOptions("zone");

    expect(lastWhere(db.zone)).toEqual({ id: { in: [1] } });
  });

  it.each([
    ["faction", db.faction],
    ["npc", db.npc],
    ["deities", db.deities],
    ["magicitems", db.magicitems],
  ] as const)("offers only revealed %s", async (table, model) => {
    await fetchFieldOptions(table);

    expect(lastWhere(model)).toEqual(REVEALED);
  });

  it("offers none of the DM's prep", async () => {
    await expect(fetchFieldOptions("treasure")).resolves.toEqual([]);
    await expect(fetchFieldOptions("campaign")).resolves.toEqual([]);
    expect(db.treasure.findMany).not.toHaveBeenCalled();
  });

  it("offers the rules catalogues in full", async () => {
    await fetchFieldOptions("dhDomain");

    expect(lastWhere(db.dhDomain)).toBeUndefined();
  });
});
