import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  remove: vi.fn(),
  adversaryCount: vi.fn(),
  zoneCount: vi.fn(),
  checkRecordImageReference: vi.fn(),
  releaseReplacedRecordImage: vi.fn(),
  deleteRecordImage: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhEnvironment: {
      create: db.create,
      update: db.update,
      findUnique: db.findUnique,
      delete: db.remove,
    },
    dhAdversary: { count: db.adversaryCount },
    zone: { count: db.zoneCount },
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

import createDhEnvironment from "./createDhEnvironment";
import updateDhEnvironment from "./updateDhEnvironment";
import { deleteDhEnvironmentById } from "./deleteDhEnvironmentById";

// Invented content only (SPEC-018 §5).
const valid: DhEnvironment = {
  id: 0,
  name: "Lamplit Market",
  description: "<p>Stalls under paper lanterns.</p>",
  tier: 1,
  environmentType: "social",
  impulses: "Haggle, gossip, close at dusk",
  difficulty: 11,
  otherAdversaries: "Pickpockets",
  origin: "homebrew",
  environmentAdversaryIds: [3, 3, 4],
  environmentPlaceIds: [7],
};

const lastData = (mock: typeof db.create) =>
  (mock.mock.lastCall as [{ data: Record<string, unknown> }])[0].data;

describe("Daggerheart environment actions (SPEC-028 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.checkRecordImageReference.mockResolvedValue(null);
    db.create.mockResolvedValue({});
    db.update.mockResolvedValue({});
    db.findUnique.mockResolvedValue({ id: 5, imageId: null });
    db.adversaryCount.mockResolvedValue(2);
    db.zoneCount.mockResolvedValue(1);
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhEnvironment(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(
      updateDhEnvironment({ ...valid, id: 5 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(db.create).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("creates an environment with each adversary listed once, and its places", async () => {
    await expect(createDhEnvironment(valid)).resolves.toEqual({ ok: true });

    expect(lastData(db.create)).toMatchObject({
      name: "Lamplit Market",
      environmentType: "social",
      adversaries: { create: [{ adversaryId: 3 }, { adversaryId: 4 }] },
      places: { connect: [{ id: 7 }] },
    });
  });

  it("refuses a missing adversary or place, field by field", async () => {
    db.adversaryCount.mockResolvedValue(1);
    db.zoneCount.mockResolvedValue(0);

    await expect(createDhEnvironment(valid)).resolves.toEqual({
      ok: false,
      errors: {
        environmentAdversaryIds: [{ key: "adversaryNotFound" }],
        environmentPlaceIds: [{ key: "placeNotFound" }],
      },
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses a type outside the four, and a tier outside 1–4", async () => {
    const result = await createDhEnvironment({
      ...valid,
      environmentType: "dungeon",
      tier: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "environmentType",
      "tier",
    ]);
  });

  it("replaces the links when the payload carries them, and keeps them when not", async () => {
    await updateDhEnvironment({
      id: 5,
      environmentAdversaryIds: [4],
      environmentPlaceIds: [],
    } as unknown as DhEnvironment);
    expect(lastData(db.update)).toEqual({
      adversaries: { deleteMany: {}, create: [{ adversaryId: 4 }] },
      places: { set: [] },
    });

    await updateDhEnvironment({ id: 5, name: "Night Market" } as DhEnvironment);
    expect(lastData(db.update)).toEqual({ name: "Night Market" });
  });

  it("deletes an environment and its image, and 404s a missing one", async () => {
    db.findUnique.mockResolvedValueOnce({ id: 5, imageId: 8 });
    await deleteDhEnvironmentById(5);
    expect(db.remove).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(db.deleteRecordImage).toHaveBeenCalledWith(8);

    db.findUnique.mockResolvedValueOnce(null);
    await expect(deleteDhEnvironmentById(6)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
