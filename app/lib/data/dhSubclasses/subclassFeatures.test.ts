import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create, update, findMany, findUnique, del, transaction } = vi.hoisted(
  () => ({
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    del: vi.fn(),
    transaction: vi.fn(),
  })
);
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhSubclassFeature: { create, update, findMany, findUnique, delete: del },
    $transaction: transaction,
  },
}));

import createDhSubclassFeature from "./createDhSubclassFeature";
import updateDhSubclassFeature from "./updateDhSubclassFeature";
import deleteDhSubclassFeatureById from "./deleteDhSubclassFeatureById";
import reorderDhSubclassFeatures from "./reorderDhSubclassFeatures";

// Invented content only (SPEC-018 §5).
const feature = {
  subclassId: 6,
  tier: DhSubclassFeatureTier.Specialization,
  position: 1,
  name: "Banked Coals",
  text: "<p>Warmth kept for later.</p>",
};

describe("subclass feature actions (SPEC-021 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    create.mockResolvedValue({});
    update.mockResolvedValue({});
    del.mockResolvedValue({});
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
  });

  it("rejects unauthenticated requests without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhSubclassFeature(feature)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(
      updateDhSubclassFeature({ id: 1, name: "X" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(deleteDhSubclassFeatureById(1)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(
      reorderDhSubclassFeatures(6, DhSubclassFeatureTier.Mastery, [1])
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("adds a feature to its tier", async () => {
    const result = await createDhSubclassFeature(feature);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({ data: feature });
  });

  it("refuses a tier outside foundation / specialization / mastery", async () => {
    const result = await createDhSubclassFeature({
      ...feature,
      tier: "legendary" as DhSubclassFeatureTier,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.tier).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("moves a feature to another tier with its new place there", async () => {
    await updateDhSubclassFeature({
      id: 3,
      tier: DhSubclassFeatureTier.Mastery,
      position: 2,
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { tier: "mastery", position: 2 },
    });
  });

  it("reorders within one tier only", async () => {
    findMany.mockResolvedValue([{ id: 4 }, { id: 5 }]);

    const result = await reorderDhSubclassFeatures(
      6,
      DhSubclassFeatureTier.Foundation,
      [5, 4]
    );

    expect(result).toEqual({ ok: true });
    expect(findMany).toHaveBeenCalledWith({
      where: { subclassId: 6, tier: "foundation" },
      select: { id: true },
    });
    expect(update.mock.calls).toEqual([
      [{ where: { id: 5 }, data: { position: 1 } }],
      [{ where: { id: 4 }, data: { position: 2 } }],
    ]);
  });

  it("refuses a reorder naming a feature from another tier", async () => {
    findMany.mockResolvedValue([{ id: 4 }, { id: 5 }]);

    const result = await reorderDhSubclassFeatures(
      6,
      DhSubclassFeatureTier.Foundation,
      [5, 7]
    );

    expect(result).toEqual({
      ok: false,
      errors: { orderedIds: [{ key: "subclassFeatureOrderMismatch" }] },
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes a feature, even the subclass's last", async () => {
    findUnique.mockResolvedValue({ id: 4, subclassId: 6 });

    await deleteDhSubclassFeatureById(4);

    expect(del).toHaveBeenCalledWith({ where: { id: 4 } });
  });
});
