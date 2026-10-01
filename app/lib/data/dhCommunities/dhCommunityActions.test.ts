import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  remove: vi.fn(),
  zoneCount: vi.fn(),
  factionCount: vi.fn(),
  checkRecordImageReference: vi.fn(),
  deleteRecordImage: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhCommunity: {
      create: db.create,
      update: db.update,
      findUnique: db.findUnique,
      delete: db.remove,
    },
    zone: { count: db.zoneCount },
    faction: { count: db.factionCount },
  },
}));
vi.mock("@/app/lib/data/recordImages/checkRecordImageReference", () => ({
  default: db.checkRecordImageReference,
}));
vi.mock("@/app/lib/data/recordImages/releaseReplacedRecordImage", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: db.deleteRecordImage,
}));

import createDhCommunity from "./createDhCommunity";
import updateDhCommunity from "./updateDhCommunity";
import { deleteDhCommunityById } from "./deleteDhCommunityById";

// Invented content only (SPEC-018 §5).
const valid: DhCommunity = {
  id: 0,
  name: "Valefolk",
  description: "<p>Under the old hills.</p>",
  adjectives: "patient, wry",
  communityFeatureName: "Long memory",
  communityFeatureText: "<p>Recall an old road.</p>",
  communityPlaceIds: [1, 3],
  communityFactionIds: [2],
  origin: "homebrew",
};

describe("Daggerheart community actions (SPEC-027 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.checkRecordImageReference.mockResolvedValue(null);
    db.zoneCount.mockImplementation(
      ({ where }: { where: { id: { in: number[] } } }) =>
        Promise.resolve(where.id.in.length)
    );
    db.factionCount.mockImplementation(
      ({ where }: { where: { id: { in: number[] } } }) =>
        Promise.resolve(where.id.in.length)
    );
    db.create.mockResolvedValue({});
    db.update.mockResolvedValue({});
    db.findUnique.mockResolvedValue({ id: 5, imageId: null });
  });

  it("rejects an unauthenticated create without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhCommunity(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it("creates a community connected to its places and factions", async () => {
    await expect(createDhCommunity(valid)).resolves.toEqual({ ok: true });

    const [{ data }] = db.create.mock.lastCall as [
      { data: Record<string, unknown> },
    ];
    expect(data).toMatchObject({
      name: "Valefolk",
      adjectives: "patient, wry",
      communityFeatureName: "Long memory",
      places: { connect: [{ id: 1 }, { id: 3 }] },
      factions: { connect: [{ id: 2 }] },
    });
  });

  it("refuses a community without its feature, field by field", async () => {
    const result = await createDhCommunity({
      ...valid,
      communityFeatureName: "",
      communityFeatureText: "",
    });

    expect(result.ok === false && Object.keys(result.errors).sort()).toEqual([
      "communityFeatureName",
      "communityFeatureText",
    ]);
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses a link to a place or faction that does not exist", async () => {
    db.zoneCount.mockResolvedValue(1);
    db.factionCount.mockResolvedValue(0);

    const result = await createDhCommunity(valid);

    expect(result).toEqual({
      ok: false,
      errors: {
        communityPlaceIds: [{ key: "placeNotFound" }],
        communityFactionIds: [{ key: "factionNotFound" }],
      },
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("replaces the links as sets when an update carries them", async () => {
    await updateDhCommunity({ ...valid, id: 5, communityPlaceIds: [3] });

    const [{ where, data }] = db.update.mock.lastCall as [
      { where: object; data: Record<string, unknown> },
    ];
    expect(where).toEqual({ id: 5 });
    expect(data).toMatchObject({
      places: { set: [{ id: 3 }] },
      factions: { set: [{ id: 2 }] },
    });
  });

  it("leaves the links alone when an update does not carry them", async () => {
    const { communityPlaceIds, communityFactionIds, ...withoutLinks } = valid;
    void communityPlaceIds;
    void communityFactionIds;

    await updateDhCommunity({ ...withoutLinks, id: 5 } as DhCommunity);

    const [{ data }] = db.update.mock.lastCall as [
      { data: Record<string, unknown> },
    ];
    expect(data).not.toHaveProperty("places");
    expect(data).not.toHaveProperty("factions");
  });

  it("deletes a community and its picture", async () => {
    db.findUnique.mockResolvedValue({ id: 5, imageId: 9 });

    await deleteDhCommunityById(5);

    expect(db.remove).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(db.deleteRecordImage).toHaveBeenCalledWith(9);
  });
});
