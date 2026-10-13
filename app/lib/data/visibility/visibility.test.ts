import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findMany } },
}));

import checkRevealCampaigns from "./checkRevealCampaigns";
import { revealedToCreate, revealedToUpdate } from "./revealedToWrite";
import withRevealedIds from "./withRevealedIds";

describe("checkRevealCampaigns (SPEC-022 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts nothing to check without a query", async () => {
    await expect(
      checkRevealCampaigns(undefined, { field: "revealedTo" })
    ).resolves.toBeNull();
    await expect(
      checkRevealCampaigns([], { field: "revealedTo" })
    ).resolves.toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("accepts existing campaigns of any system for the shared world", async () => {
    findMany.mockResolvedValue([
      { id: 1, system: "dnd5e" },
      { id: 2, system: "daggerheart" },
    ]);

    await expect(
      checkRevealCampaigns([1, 2], { field: "revealedTo" })
    ).resolves.toBeNull();
  });

  it("reads only active campaigns, so an archived one is not found (SPEC-032 §5.6)", async () => {
    findMany.mockResolvedValue([]);

    await expect(
      checkRevealCampaigns([9], { field: "revealedTo" })
    ).resolves.toEqual({ revealedTo: [{ key: "campaignNotFound" }] });
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: [9] }, archivedAt: null },
      select: { id: true, system: true },
    });
  });

  it("names a missing campaign under the field", async () => {
    findMany.mockResolvedValue([{ id: 1, system: "dnd5e" }]);

    await expect(
      checkRevealCampaigns([1, 9], { field: "revealedTo" })
    ).resolves.toEqual({ revealedTo: [{ key: "campaignNotFound" }] });
  });

  it("refuses another system's campaign for a one-system catalogue", async () => {
    findMany.mockResolvedValue([{ id: 2, system: "daggerheart" }]);

    await expect(
      checkRevealCampaigns([2], { field: "revealedToDnd5e", system: "dnd5e" })
    ).resolves.toEqual({ revealedToDnd5e: [{ key: "revealWrongSystem" }] });
  });

  it("counts a repeated id once", async () => {
    findMany.mockResolvedValue([{ id: 1, system: "dnd5e" }]);

    await expect(
      checkRevealCampaigns([1, 1], { field: "revealedTo" })
    ).resolves.toBeNull();
  });
});

describe("revealedToWrite", () => {
  it("connects on create, and writes nothing for no campaigns", () => {
    expect(revealedToCreate([1, 2])).toEqual({
      revealedTo: { connect: [{ id: 1 }, { id: 2 }] },
    });
    expect(revealedToCreate([])).toEqual({});
    expect(revealedToCreate(undefined)).toEqual({});
  });

  // SPEC-032 §9, _Risks_: the picker lists active campaigns only, so an
  // update must neither `set` the relation nor touch an archived campaign.
  it("connects the listed campaigns and disconnects only the active ones left out", async () => {
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await expect(revealedToUpdate([3, 1])).resolves.toEqual({
      revealedTo: {
        connect: [{ id: 3 }, { id: 1 }],
        disconnect: [{ id: 2 }],
      },
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { archivedAt: null },
      select: { id: true },
    });
  });

  it("empties the active reveals when told to, and never names an archived campaign", async () => {
    // Campaign 9 is archived: the active read does not return it.
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const write = await revealedToUpdate([]);

    expect(write).toEqual({
      revealedTo: { connect: [], disconnect: [{ id: 1 }, { id: 2 }] },
    });
    expect(JSON.stringify(write)).not.toContain('"id":9');
    expect(write.revealedTo).not.toHaveProperty("set");
  });

  it("leaves the reveals alone, without a read, when an update does not carry the field", async () => {
    findMany.mockClear();

    await expect(revealedToUpdate(undefined)).resolves.toEqual({});
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("withRevealedIds", () => {
  it("flattens the relation into the field the page declares", () => {
    const row = { id: 4, revealedTo: [{ id: 1 }, { id: 2 }] };

    expect(withRevealedIds(row)).toMatchObject({ revealedTo: [1, 2] });
    expect(withRevealedIds(row, "revealedToDnd5e")).toMatchObject({
      revealedToDnd5e: [1, 2],
    });
  });

  it("reads a row without the relation as revealed to nobody", () => {
    const row: { id: number; revealedTo?: { id: number }[] } = { id: 4 };
    expect(withRevealedIds(row)).toMatchObject({ revealedTo: [] });
  });
});
