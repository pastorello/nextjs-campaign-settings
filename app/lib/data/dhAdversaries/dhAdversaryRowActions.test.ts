import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const model = () => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  delete: vi.fn(),
});
const db = vi.hoisted(() => ({
  experience: {} as ReturnType<typeof model>,
  feature: {} as ReturnType<typeof model>,
  transaction: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhAdversaryExperience: db.experience,
    dhAdversaryFeature: db.feature,
    $transaction: db.transaction,
  },
}));

import createDhAdversaryExperience from "./createDhAdversaryExperience";
import updateDhAdversaryExperience from "./updateDhAdversaryExperience";
import deleteDhAdversaryExperienceById from "./deleteDhAdversaryExperienceById";
import reorderDhAdversaryExperiences from "./reorderDhAdversaryExperiences";
import createDhAdversaryFeature from "./createDhAdversaryFeature";
import updateDhAdversaryFeature from "./updateDhAdversaryFeature";
import deleteDhAdversaryFeatureById from "./deleteDhAdversaryFeatureById";
import reorderDhAdversaryFeatures from "./reorderDhAdversaryFeatures";

// Invented content only (SPEC-018 §5).
const experience = {
  adversaryId: 4,
  position: 1,
  name: "Old haunts",
  bonus: 2,
};
const feature = {
  adversaryId: 4,
  position: 1,
  kind: "reaction",
  fear: true,
  name: "Gutter flame",
  text: "<p>It flares when struck.</p>",
};

describe("an adversary's inline rows (SPEC-028 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(db.experience, model());
    Object.assign(db.feature, model());
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.transaction.mockResolvedValue([]);
  });

  it("refuses every write without a DM session, writing nothing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    for (const write of [
      () => createDhAdversaryExperience(experience),
      () => updateDhAdversaryExperience({ id: 1, name: "X" }),
      () => deleteDhAdversaryExperienceById(1),
      () => reorderDhAdversaryExperiences(4, [1]),
      () => createDhAdversaryFeature(feature),
      () => updateDhAdversaryFeature({ id: 1, name: "X" }),
      () => deleteDhAdversaryFeatureById(1),
      () => reorderDhAdversaryFeatures(4, [1]),
    ]) {
      await expect(write()).rejects.toBeInstanceOf(UnauthorizedError);
    }
    expect(db.experience.create).not.toHaveBeenCalled();
    expect(db.feature.create).not.toHaveBeenCalled();
  });

  it("adds an experience and a Fear feature to their adversary", async () => {
    await expect(createDhAdversaryExperience(experience)).resolves.toEqual({
      ok: true,
    });
    await expect(createDhAdversaryFeature(feature)).resolves.toEqual({
      ok: true,
    });

    expect(db.experience.create).toHaveBeenCalledWith({ data: experience });
    expect(db.feature.create).toHaveBeenCalledWith({ data: feature });
  });

  it("refuses a nameless experience, a zero bonus, an unknown kind and an empty text", async () => {
    const badExperience = await createDhAdversaryExperience({
      ...experience,
      name: " ",
      bonus: 0,
    });
    const badFeature = await createDhAdversaryFeature({
      ...feature,
      kind: "ambush",
      text: "<p></p>",
    });

    expect(badExperience.ok).toBe(false);
    if (!badExperience.ok) {
      expect(Object.keys(badExperience.errors).sort()).toEqual([
        "bonus",
        "name",
      ]);
    }
    expect(badFeature.ok).toBe(false);
    if (!badFeature.ok) {
      expect(Object.keys(badFeature.errors).sort()).toEqual(["kind", "text"]);
    }
    expect(db.experience.create).not.toHaveBeenCalled();
    expect(db.feature.create).not.toHaveBeenCalled();
  });

  it("updates only a row's own fields, never its adversary", async () => {
    await updateDhAdversaryFeature({ id: 7, fear: false, adversaryId: 99 });

    expect(db.feature.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { fear: false },
    });
  });

  it("deletes a row, and 404s a missing one", async () => {
    db.experience.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(deleteDhAdversaryExperienceById(1)).resolves.toEqual({
      ok: true,
    });
    expect(db.experience.delete).toHaveBeenCalledWith({ where: { id: 1 } });

    db.feature.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhAdversaryFeatureById(2)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("reorders only the adversary's own rows, all of them", async () => {
    db.feature.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await expect(reorderDhAdversaryFeatures(4, [2, 1])).resolves.toEqual({
      ok: true,
    });
    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { adversaryId: 4 },
      select: { id: true },
    });
    expect(db.transaction).toHaveBeenCalledOnce();

    await expect(reorderDhAdversaryFeatures(4, [2])).resolves.toEqual({
      ok: false,
      errors: { orderedIds: [{ key: "adversaryFeatureOrderMismatch" }] },
    });
  });
});
