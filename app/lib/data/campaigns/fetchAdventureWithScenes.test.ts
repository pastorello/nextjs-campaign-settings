import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

const findUnique = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { adventure: { findUnique } },
}));

const baseAdventureRow = {
  id: 10,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Mire",
  synopsis: null,
  timeline: null,
  status: "active",
  xpTarget: null,
  currencyTarget: null,
  currencyUnit: null,
  permanentItemTarget: null,
  consumableTarget: null,
};

describe("fetchAdventureWithScenes (SPEC-013 T5)", () => {
  it("returns null when the adventure does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const { default: fetchAdventureWithScenes } =
      await import("./fetchAdventureWithScenes");

    expect(await fetchAdventureWithScenes(999)).toBeNull();
  });

  it("returns the adventure with its scenes, creatures and loot in position order", async () => {
    findUnique.mockResolvedValue({
      ...baseAdventureRow,
      scenes: [
        {
          id: 1,
          adventureId: 10,
          position: 1,
          kind: "fight",
          title: "Ambush at the ford",
          description: null,
          xpAward: 100,
          grantsHeroPoint: false,
          awarded: false,
          zoneId: null,
          createdAt: new Date("2026-08-01"),
          updatedAt: new Date("2026-08-01"),
          creatures: [
            {
              id: 1,
              sceneId: 1,
              position: 1,
              name: "Bandit",
              level: null,
              xpEach: 25,
              quantity: 4,
              note: null,
              awarded: false,
              npcId: null,
            },
          ],
          loot: [
            {
              id: 1,
              sceneId: 1,
              position: 1,
              description: "A pouch of coins",
              quantity: 1,
              value: 50,
              taken: false,
              magicItemId: null,
              treasureId: null,
            },
          ],
        },
      ],
    });

    const { default: fetchAdventureWithScenes } =
      await import("./fetchAdventureWithScenes");
    const result = await fetchAdventureWithScenes(10);

    expect(result?.status).toBe(AdventureStatus.Active);
    expect(result?.scenes).toHaveLength(1);
    expect(result?.scenes[0]?.kind).toBe(SceneKind.Fight);
    expect(result?.scenes[0]?.creatures[0]?.name).toBe("Bandit");
    expect(result?.scenes[0]?.loot[0]?.description).toBe("A pouch of coins");
  });

  it("treats an unset budget target as no value, not zero", async () => {
    findUnique.mockResolvedValue({ ...baseAdventureRow, scenes: [] });

    const { default: fetchAdventureWithScenes } =
      await import("./fetchAdventureWithScenes");
    const result = await fetchAdventureWithScenes(10);

    expect(result?.xpTarget).toBeNull();
    expect(result?.currencyTarget).toBeNull();
    expect(result?.permanentItemTarget).toBeNull();
    expect(result?.consumableTarget).toBeNull();
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    const { default: fetchAdventureWithScenes } =
      await import("./fetchAdventureWithScenes");

    await expect(fetchAdventureWithScenes(10)).rejects.toThrow(DatabaseError);
  });
});
