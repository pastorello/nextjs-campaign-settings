import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.x.y)`.
const {
  magicitemsCount,
  npcCount,
  spellsCount,
  deitiesCount,
  zoneCount,
  factionCount,
  transaction,
} = vi.hoisted(() => ({
  magicitemsCount: vi.fn(),
  npcCount: vi.fn(),
  spellsCount: vi.fn(),
  deitiesCount: vi.fn(),
  zoneCount: vi.fn(),
  factionCount: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    magicitems: { count: magicitemsCount },
    npc: { count: npcCount },
    spells: { count: spellsCount },
    deities: { count: deitiesCount },
    zone: { count: zoneCount },
    faction: { count: factionCount },
    $transaction: transaction,
  },
}));

// SPEC-022 T8c: the reader's scope; the DM's unless a test says otherwise.
const scope = vi.hoisted((): { current: object } => ({
  current: { kind: "all" },
}));
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve(scope.current),
}));

import fetchCardData from "./fetchCardData";

describe("fetchCardData (TD-91)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.current = { kind: "all" };
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
  });

  it("counts all six domains, including places and factions", async () => {
    magicitemsCount.mockResolvedValue(1);
    npcCount.mockResolvedValue(2);
    spellsCount.mockResolvedValue(3);
    deitiesCount.mockResolvedValue(4);
    zoneCount.mockResolvedValue(5);
    factionCount.mockResolvedValue(6);

    await expect(fetchCardData()).resolves.toEqual({
      numberOfmagicItems: 1,
      numberOfNpc: 2,
      numberOfSpells: 3,
      numberOfDeities: 4,
      numberOfPlaces: 5,
      numberOfFactions: 6,
    });
  });

  it("counts every place in the tree, not only positioned ones (DM decision, TD-91)", async () => {
    [
      magicitemsCount,
      npcCount,
      spellsCount,
      deitiesCount,
      zoneCount,
      factionCount,
    ].forEach((fn) => fn.mockResolvedValue(0));

    await fetchCardData();

    // No `where` filter at all — every place counts, positioned or not.
    expect(zoneCount).toHaveBeenCalledWith();
  });

  it("wraps a query failure as a DatabaseError", async () => {
    transaction.mockRejectedValue(new Error("connection reset"));

    await expect(fetchCardData()).rejects.toBeInstanceOf(DatabaseError);
  });
});

// SPEC-022 T8c (R1): a player's overview counts their campaign's share.
describe("fetchCardData for a player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.current = {
      kind: "campaign",
      campaignId: 7,
      zones: new Set([1, 2]),
      pois: new Set(),
    };
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    for (const count of [
      magicitemsCount,
      npcCount,
      spellsCount,
      deitiesCount,
      zoneCount,
      factionCount,
    ]) {
      count.mockResolvedValue(0);
    }
  });

  it("counts the revealed records, the visible places and every spell", async () => {
    await fetchCardData();

    const revealed = { where: { revealedTo: { some: { id: 7 } } } };
    expect(magicitemsCount).toHaveBeenCalledWith(revealed);
    expect(npcCount).toHaveBeenCalledWith(revealed);
    expect(deitiesCount).toHaveBeenCalledWith(revealed);
    expect(factionCount).toHaveBeenCalledWith(revealed);
    expect(zoneCount).toHaveBeenCalledWith({ where: { id: { in: [1, 2] } } });
    expect(spellsCount).toHaveBeenCalledWith();
  });
});
