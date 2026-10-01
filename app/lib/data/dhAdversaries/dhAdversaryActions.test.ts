import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import ConflictError from "@/app/lib/errors/ConflictError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  remove: vi.fn(),
  countListings: vi.fn(),
  checkRecordImageReference: vi.fn(),
  releaseReplacedRecordImage: vi.fn(),
  deleteRecordImage: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhAdversary: {
      create: db.create,
      update: db.update,
      findUnique: db.findUnique,
      delete: db.remove,
    },
    dhEnvironmentAdversary: { count: db.countListings },
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

import createDhAdversary from "./createDhAdversary";
import updateDhAdversary from "./updateDhAdversary";
import { deleteDhAdversaryById } from "./deleteDhAdversaryById";

// Invented content only (SPEC-018 §5): no SRD adversary names or numbers
// copied from a stat block.
const valid: DhAdversary = {
  id: 0,
  name: "Lantern Wraith",
  description: "<p>A cold light that walks.</p>",
  tier: 2,
  adversaryType: "skulk",
  hordeDensity: null,
  motives: "<p>Lure, drain, vanish.</p>",
  difficulty: 13,
  majorThreshold: 8,
  severeThreshold: 15,
  hp: 5,
  stress: 3,
  attackModifier: 1,
  attackName: "Chill touch",
  attackRange: "melee",
  attackDamage: "2D6 + 2",
  attackType: "magic",
  origin: "homebrew",
};

/** The `data` of the last write through `mock`. */
const lastData = (mock: typeof db.create) =>
  (mock.mock.lastCall as [{ data: Record<string, unknown> }])[0].data;

describe("Daggerheart adversary actions (SPEC-028 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.checkRecordImageReference.mockResolvedValue(null);
    db.create.mockResolvedValue({});
    db.update.mockResolvedValue({});
    db.findUnique.mockResolvedValue({ ...valid, id: 4, imageId: null });
    db.countListings.mockResolvedValue(0);
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhAdversary(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(updateDhAdversary({ ...valid, id: 4 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("creates a stat block, its damage normalised", async () => {
    await expect(createDhAdversary(valid)).resolves.toEqual({ ok: true });

    expect(lastData(db.create)).toMatchObject({
      name: "Lantern Wraith",
      tier: 2,
      adversaryType: "skulk",
      attackDamage: "2d6+2",
      majorThreshold: 8,
      severeThreshold: 15,
    });
  });

  it("refuses an unparseable damage, a tier out of range, and HP over 12", async () => {
    const result = await createDhAdversary({
      ...valid,
      attackDamage: "2d7",
      tier: 5,
      hp: 13,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.attackDamage).toEqual([{ key: "diceExpression" }]);
    expect(result.errors.tier).toBeDefined();
    expect(result.errors.hp).toBeDefined();
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses a horde without a density, field by field", async () => {
    const result = await createDhAdversary({
      ...valid,
      adversaryType: "horde",
    });

    expect(result).toEqual({
      ok: false,
      errors: { hordeDensity: [{ key: "hordeNeedsDensity" }] },
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("reads a blank threshold as none: a minion without thresholds is kept", async () => {
    await expect(
      createDhAdversary({
        ...valid,
        adversaryType: "minion",
        majorThreshold: "" as unknown as null,
        severeThreshold: "" as unknown as null,
      })
    ).resolves.toEqual({ ok: true });

    expect(lastData(db.create)).toMatchObject({
      majorThreshold: null,
      severeThreshold: null,
    });
  });

  it("judges an update on the row as it would be stored", async () => {
    // The stored row has thresholds 8/15; changing only Major to 20 breaks
    // the order, and changing only the type to horde lacks a density.
    const byMajor = await updateDhAdversary({
      id: 4,
      majorThreshold: 20,
    } as DhAdversary);
    const byType = await updateDhAdversary({
      id: 4,
      adversaryType: "horde",
    } as DhAdversary);

    expect(byMajor).toEqual({
      ok: false,
      errors: { severeThreshold: [{ key: "majorBelowSevere" }] },
    });
    expect(byType).toEqual({
      ok: false,
      errors: { hordeDensity: [{ key: "hordeNeedsDensity" }] },
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates only what the payload carries", async () => {
    await expect(
      updateDhAdversary({ id: 4, name: "Lantern Wraith II" } as DhAdversary)
    ).resolves.toEqual({ ok: true });

    expect(db.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { name: "Lantern Wraith II" },
    });
  });

  it("checks a new image, and releases the one it replaces once saved", async () => {
    db.findUnique.mockResolvedValue({ ...valid, id: 4, imageId: 3 });

    await updateDhAdversary({ id: 4, imageId: 7 } as DhAdversary);

    expect(db.checkRecordImageReference).toHaveBeenCalledWith(7, {
      relation: "dhAdversary",
      id: 4,
    });
    expect(db.releaseReplacedRecordImage).toHaveBeenCalledWith(3, 7);
  });

  it("refuses to delete an adversary an environment lists, with the count", async () => {
    db.countListings.mockResolvedValue(2);

    const refusal = await deleteDhAdversaryById(4).catch(
      (error: unknown) => error
    );

    expect(refusal).toBeInstanceOf(ConflictError);
    expect((refusal as ConflictError).refusal).toEqual({
      key: "adversaryInEnvironments",
      values: { count: 2 },
    });
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("deletes an unlisted adversary and its image, and 404s a missing one", async () => {
    db.findUnique.mockResolvedValueOnce({ ...valid, id: 4, imageId: 9 });
    await deleteDhAdversaryById(4);
    expect(db.remove).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(db.deleteRecordImage).toHaveBeenCalledWith(9);

    db.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhAdversaryById(5)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
