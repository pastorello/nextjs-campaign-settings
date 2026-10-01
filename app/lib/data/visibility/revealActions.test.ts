import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { model, checkRevealCampaigns } = vi.hoisted(() => ({
  model: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  checkRevealCampaigns: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    npc: model,
    deities: model,
    faction: model,
    magicitems: model,
  },
}));
vi.mock("@/app/lib/data/visibility/checkRevealCampaigns", () => ({
  default: checkRevealCampaigns,
}));
vi.mock("@/app/lib/data/recordImages/checkRecordImageReference", () => ({
  default: () => Promise.resolve(null),
}));
vi.mock("@/app/lib/data/recordImages/releaseReplacedRecordImage", () => ({
  default: () => Promise.resolve(),
}));

import updateNpc from "@/app/lib/data/npc/updateNpc";
import createFaction from "@/app/lib/data/faction/createFaction";
import updateFaction from "@/app/lib/data/faction/updateFaction";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";

/**
 * SPEC-022 T6: every revealable domain's create and update write the
 * campaigns it is revealed to, after `checkRevealCampaigns` agrees. The
 * domains' own suites cover their other fields.
 */
describe("reveals in the domain actions (SPEC-022 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    checkRevealCampaigns.mockResolvedValue(null);
    model.create.mockResolvedValue({});
    model.update.mockResolvedValue({});
  });

  it("creates a faction already revealed to the given campaigns", async () => {
    await expect(
      createFaction({
        name: "Lantern Court",
        description: "",
        revealedTo: [1, 2],
      } as never)
    ).resolves.toEqual({ ok: true });

    expect(checkRevealCampaigns).toHaveBeenCalledWith([1, 2], {
      field: "revealedTo",
    });
    expect(model.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        revealedTo: { connect: [{ id: 1 }, { id: 2 }] },
      }) as unknown,
    });
  });

  it("replaces an NPC's reveals as a set on update", async () => {
    await expect(
      updateNpc({ id: 5, revealedTo: [3] } as never)
    ).resolves.toEqual({ ok: true });

    expect(model.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { revealedTo: { set: [{ id: 3 }] } },
    });
  });

  it("leaves a deity's reveals alone when the edit does not touch them", async () => {
    await updateDeity({ id: 5, name: "Veil" } as never);

    expect(model.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { name: "Veil" },
    });
  });

  it("writes nothing when a campaign is refused", async () => {
    checkRevealCampaigns.mockResolvedValue({
      revealedTo: [{ key: "campaignNotFound" }],
    });

    await expect(
      updateFaction({ id: 5, revealedTo: [9] } as never)
    ).resolves.toEqual({
      ok: false,
      errors: { revealedTo: [{ key: "campaignNotFound" }] },
    });
    expect(model.update).not.toHaveBeenCalled();
  });

  it("checks a magic item's campaigns against 5e", async () => {
    await createMagicItem({
      name: "Lantern",
      description: "",
      rarity: 1,
      type: 1,
      attuned: false,
      consumable: false,
      revealedToDnd5e: [1],
    } as never);
    await updateMagicItem({ id: 5, revealedToDnd5e: [1] } as never);

    expect(checkRevealCampaigns).toHaveBeenNthCalledWith(1, [1], {
      field: "revealedToDnd5e",
      system: "dnd5e",
    });
    expect(model.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { revealedTo: { set: [{ id: 1 }] } },
    });
  });

  it("creates a faction revealed to nobody when the field is left out", async () => {
    await createFaction({ name: "Lantern Court", description: "" } as never);

    const { data } = model.create.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(data).not.toHaveProperty("revealedTo");
  });
});
