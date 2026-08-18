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

import fetchCardData from "./fetchCardData";

describe("fetchCardData (TD-91)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
