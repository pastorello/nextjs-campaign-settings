import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
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
    dhArmor: {
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

import createDhArmor from "./createDhArmor";
import updateDhArmor from "./updateDhArmor";
import { deleteDhArmorById } from "./deleteDhArmorById";

// Invented content only (SPEC-018 §5).
const valid: DhArmor = {
  id: 0,
  name: "Lamplighter's Coat",
  tier: 1,
  armorMajor: 5,
  armorSevere: 11,
  armorScore: 3,
  armorFeatureName: null,
  armorFeatureText: null,
  origin: "homebrew",
};

describe("Daggerheart armor actions (SPEC-029 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.checkRecordImageReference.mockResolvedValue(null);
    db.create.mockResolvedValue({});
    db.update.mockResolvedValue({});
    db.findUnique.mockResolvedValue({ ...valid, id: 4, imageId: null });
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhArmor(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(updateDhArmor({ ...valid, id: 4 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it("creates an armor with no feature", async () => {
    await expect(createDhArmor(valid)).resolves.toEqual({ ok: true });
    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        armorMajor: 5,
        armorSevere: 11,
        armorFeatureName: null,
        armorFeatureText: null,
      }) as unknown,
    });
  });

  it("refuses an armor score over 12 and a tier over 4", async () => {
    const result = await createDhArmor({ ...valid, armorScore: 13, tier: 5 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["armorScore", "tier"]);
  });

  it("refuses Major at or above Severe, on Severe", async () => {
    await expect(createDhArmor({ ...valid, armorMajor: 11 })).resolves.toEqual({
      ok: false,
      errors: { armorSevere: [{ key: "majorBelowSevere" }] },
    });
  });

  it("judges an update's thresholds on the row as it would be stored", async () => {
    await expect(
      updateDhArmor({ id: 4, armorSevere: 5 } as DhArmor)
    ).resolves.toEqual({
      ok: false,
      errors: { armorSevere: [{ key: "majorBelowSevere" }] },
    });
    expect(db.update).not.toHaveBeenCalled();

    await expect(
      updateDhArmor({ id: 4, armorSevere: 12 } as DhArmor)
    ).resolves.toEqual({ ok: true });
  });

  it("refuses half a feature", async () => {
    await expect(
      createDhArmor({ ...valid, armorFeatureName: "Warm" })
    ).resolves.toEqual({
      ok: false,
      errors: { armorFeatureText: [{ key: "featureNeedsBoth" }] },
    });
  });

  it("deletes an armor and its image, and 404s a missing one", async () => {
    db.findUnique.mockResolvedValueOnce({ id: 4, imageId: 9 });
    await deleteDhArmorById(4);
    expect(db.deleteRecordImage).toHaveBeenCalledWith(9);

    db.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhArmorById(5)).rejects.toBeInstanceOf(NotFoundError);
  });
});
