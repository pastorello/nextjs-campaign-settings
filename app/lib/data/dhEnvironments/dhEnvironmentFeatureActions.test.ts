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
  feature: {} as ReturnType<typeof model>,
  transaction: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhEnvironmentFeature: db.feature,
    $transaction: db.transaction,
  },
}));

import createDhEnvironmentFeature from "./createDhEnvironmentFeature";
import updateDhEnvironmentFeature from "./updateDhEnvironmentFeature";
import deleteDhEnvironmentFeatureById from "./deleteDhEnvironmentFeatureById";
import reorderDhEnvironmentFeatures from "./reorderDhEnvironmentFeatures";

// Invented content only (SPEC-018 §5).
const feature = {
  environmentId: 5,
  position: 1,
  kind: "action",
  name: "Lanterns gutter",
  text: "<p>The light dims.</p>",
  questions: "<p>Who lit them?</p>",
};

describe("an environment's features (SPEC-028 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(db.feature, model());
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.transaction.mockResolvedValue([]);
  });

  it("refuses every write without a DM session, writing nothing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    for (const write of [
      () => createDhEnvironmentFeature(feature),
      () => updateDhEnvironmentFeature({ id: 1, name: "X" }),
      () => deleteDhEnvironmentFeatureById(1),
      () => reorderDhEnvironmentFeatures(5, [1]),
    ]) {
      await expect(write()).rejects.toBeInstanceOf(UnauthorizedError);
    }
    expect(db.feature.create).not.toHaveBeenCalled();
  });

  it("adds a feature with its questions; the questions are optional", async () => {
    await expect(createDhEnvironmentFeature(feature)).resolves.toEqual({
      ok: true,
    });
    expect(db.feature.create).toHaveBeenCalledWith({ data: feature });

    await createDhEnvironmentFeature({ ...feature, questions: null });
    expect(db.feature.create).toHaveBeenLastCalledWith({
      data: { ...feature, questions: undefined },
    });
  });

  it("refuses an unknown kind and an empty text", async () => {
    const result = await createDhEnvironmentFeature({
      ...feature,
      kind: "ambush",
      text: "<p></p>",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["kind", "text"]);
    }
  });

  it("deletes a feature, and 404s a missing one", async () => {
    db.feature.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(deleteDhEnvironmentFeatureById(1)).resolves.toEqual({
      ok: true,
    });

    db.feature.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhEnvironmentFeatureById(2)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("reorders only the environment's own features, all of them", async () => {
    db.feature.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await expect(reorderDhEnvironmentFeatures(5, [2, 1])).resolves.toEqual({
      ok: true,
    });
    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { environmentId: 5 },
      select: { id: true },
    });
    await expect(reorderDhEnvironmentFeatures(5, [2])).resolves.toEqual({
      ok: false,
      errors: { orderedIds: [{ key: "environmentFeatureOrderMismatch" }] },
    });
  });
});
