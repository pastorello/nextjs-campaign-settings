import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
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
    dhWeapon: {
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

import createDhWeapon from "./createDhWeapon";
import updateDhWeapon from "./updateDhWeapon";
import { deleteDhWeaponById } from "./deleteDhWeaponById";

// Invented content only (SPEC-018 §5).
const valid: DhWeapon = {
  id: 0,
  name: "Lantern Hook",
  tier: 1,
  weaponSlot: "primary",
  weaponTrait: "finesse",
  weaponRange: "melee",
  damageDie: 8,
  damageBonus: 1,
  weaponDamageType: "physical",
  burden: 1,
  weaponFeatureName: "Snagging",
  weaponFeatureText: "<p>It catches cloth.</p>",
  origin: "homebrew",
};

const lastData = (mock: typeof db.create) =>
  (mock.mock.lastCall as [{ data: Record<string, unknown> }])[0].data;

describe("Daggerheart weapon actions (SPEC-029 T2)", () => {
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

    await expect(createDhWeapon(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(updateDhWeapon({ ...valid, id: 4 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("creates a weapon with its feature", async () => {
    await expect(createDhWeapon(valid)).resolves.toEqual({ ok: true });

    expect(lastData(db.create)).toMatchObject({
      name: "Lantern Hook",
      damageDie: 8,
      damageBonus: 1,
      weaponFeatureName: "Snagging",
    });
  });

  it("stores a weapon with no feature as nulls", async () => {
    await createDhWeapon({
      ...valid,
      weaponFeatureName: "",
      weaponFeatureText: "",
    });

    expect(lastData(db.create)).toMatchObject({
      weaponFeatureName: null,
      weaponFeatureText: null,
    });
  });

  it("refuses an out-of-range tier, die, bonus or burden", async () => {
    const result = await createDhWeapon({
      ...valid,
      tier: 5,
      damageDie: 7,
      damageBonus: -1,
      burden: 3,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "burden",
      "damageBonus",
      "damageDie",
      "tier",
    ]);
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses half a feature, on the missing half", async () => {
    await expect(
      createDhWeapon({ ...valid, weaponFeatureText: "" })
    ).resolves.toEqual({
      ok: false,
      errors: { weaponFeatureText: [{ key: "featureNeedsBoth" }] },
    });
  });

  it("judges an update's feature on the row as it would be stored", async () => {
    // The stored row has a whole feature; clearing only its name halves it.
    await expect(
      updateDhWeapon({ id: 4, weaponFeatureName: "" } as DhWeapon)
    ).resolves.toEqual({
      ok: false,
      errors: { weaponFeatureName: [{ key: "featureNeedsBoth" }] },
    });

    await expect(
      updateDhWeapon({
        id: 4,
        weaponFeatureName: "",
        weaponFeatureText: "",
      } as DhWeapon)
    ).resolves.toEqual({ ok: true });
    expect(db.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { weaponFeatureName: null, weaponFeatureText: null },
    });
  });

  it("deletes a weapon and its image, and 404s a missing one", async () => {
    db.findUnique.mockResolvedValueOnce({ id: 4, imageId: 9 });
    await deleteDhWeaponById(4);
    expect(db.remove).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(db.deleteRecordImage).toHaveBeenCalledWith(9);

    db.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhWeaponById(5)).rejects.toBeInstanceOf(NotFoundError);
  });
});
