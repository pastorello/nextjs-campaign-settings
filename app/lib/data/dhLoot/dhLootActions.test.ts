import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  remove: vi.fn(),
  checkRecordImageReference: vi.fn(),
  releaseReplacedRecordImage: vi.fn(),
  deleteRecordImage: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhLoot: {
      create: db.create,
      update: db.update,
      findUnique: db.findUnique,
      delete: db.remove,
    },
  },
}));
vi.mock("@/app/lib/data/recordImages/checkRecordImageReference", () => ({
  default: db.checkRecordImageReference,
}));
vi.mock("@/app/lib/data/recordImages/releaseReplacedRecordImage", () => ({
  default: db.releaseReplacedRecordImage,
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: db.deleteRecordImage,
}));

import createDhLoot from "./createDhLoot";
import updateDhLoot from "./updateDhLoot";
import { deleteDhLootById } from "./deleteDhLootById";

// Invented content only (SPEC-018 §5).
const valid: DhLoot = {
  id: 0,
  name: "Bottled Dusk",
  lootKind: "consumable",
  lootRarity: "uncommon",
  rollValue: 7,
  effectText: "<p>Uncork it and the room dims.</p>",
  origin: "homebrew",
};

describe("Daggerheart loot actions (SPEC-029 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.checkRecordImageReference.mockResolvedValue(null);
    db.create.mockResolvedValue({});
    db.update.mockResolvedValue({});
    db.findUnique.mockResolvedValue({ id: 4, imageId: null });
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhLoot(valid)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(updateDhLoot({ ...valid, id: 4 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it("creates loot, and reads a blank roll value as none", async () => {
    await expect(createDhLoot(valid)).resolves.toEqual({ ok: true });
    await createDhLoot({ ...valid, rollValue: "" as unknown as null });

    expect(db.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ rollValue: null }) as unknown,
    });
  });

  it("refuses a roll value below 1, an unknown kind or rarity, and no effect", async () => {
    const result = await createDhLoot({
      ...valid,
      rollValue: 0,
      lootKind: "relic",
      lootRarity: "mythic",
      effectText: "<p></p>",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "effectText",
      "lootKind",
      "lootRarity",
      "rollValue",
    ]);
    expect(db.create).not.toHaveBeenCalled();
  });

  it("deletes loot and its image, and 404s a missing one", async () => {
    db.findUnique.mockResolvedValueOnce({ id: 4, imageId: 9 });
    await deleteDhLootById(4);
    expect(db.deleteRecordImage).toHaveBeenCalledWith(9);

    db.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhLootById(5)).rejects.toBeInstanceOf(NotFoundError);
  });
});
