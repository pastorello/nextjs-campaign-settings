import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
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
    dhAncestry: {
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

import createDhAncestry from "./createDhAncestry";
import updateDhAncestry from "./updateDhAncestry";
import { deleteDhAncestryById } from "./deleteDhAncestryById";

// Invented content only (SPEC-018 §5): no SRD ancestry names or text.
const valid: DhAncestry = {
  id: 0,
  name: "Lanternfolk",
  description: "<p>They carry their own light.</p>",
  ancestryFeatureAName: "Glow",
  ancestryFeatureAText: "<p>Light a small room.</p>",
  ancestryFeatureBName: "Wick",
  ancestryFeatureBText: "<p>Burn a little brighter once a day.</p>",
  origin: "homebrew",
};

describe("Daggerheart ancestry actions (SPEC-027 T2)", () => {
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

    await expect(createDhAncestry(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(updateDhAncestry({ ...valid, id: 4 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(db.create).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("creates an ancestry with both features", async () => {
    await expect(createDhAncestry(valid)).resolves.toEqual({ ok: true });

    const [{ data }] = db.create.mock.lastCall as [{ data: object }];
    expect(data).toMatchObject({
      name: "Lanternfolk",
      ancestryFeatureAName: "Glow",
      ancestryFeatureBText: "<p>Burn a little brighter once a day.</p>",
      origin: "homebrew",
    });
  });

  // SPEC-027 §5: an ancestry has exactly two features.
  it("refuses an ancestry with one feature, naming the missing one's name and text", async () => {
    const result = await createDhAncestry({
      ...valid,
      ancestryFeatureBName: "  ",
      ancestryFeatureBText: "<p></p>",
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && Object.keys(result.errors).sort()).toEqual([
      "ancestryFeatureBName",
      "ancestryFeatureBText",
    ]);
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses an unknown origin with a field error", async () => {
    const result = await createDhAncestry({ ...valid, origin: "stolen" });

    expect(result.ok === false && Object.keys(result.errors)).toEqual([
      "origin",
    ]);
  });

  it("refuses a picture the reference check rejects, creating nothing", async () => {
    db.checkRecordImageReference.mockResolvedValue({
      imageId: [{ key: "imageInUse" }],
    });

    const result = await createDhAncestry({ ...valid, imageId: 9 });

    expect(result).toEqual({
      ok: false,
      errors: { imageId: [{ key: "imageInUse" }] },
    });
    expect(db.checkRecordImageReference).toHaveBeenCalledWith(9, {
      relation: "dhAncestry",
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("updates an ancestry and releases the picture it replaces", async () => {
    db.findUnique.mockResolvedValue({ imageId: 7 });

    await expect(
      updateDhAncestry({ ...valid, id: 4, imageId: 8 })
    ).resolves.toEqual({ ok: true });

    const [args] = db.update.mock.lastCall as [{ where: object; data: object }];
    expect(args.where).toEqual({ id: 4 });
    expect(args.data).toMatchObject({ name: "Lanternfolk", imageId: 8 });
    expect(db.releaseReplacedRecordImage).toHaveBeenCalledWith(7, 8);
  });

  it("deletes an ancestry and its picture", async () => {
    db.findUnique.mockResolvedValue({ id: 4, imageId: 7 });

    await deleteDhAncestryById(4);

    expect(db.remove).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(db.deleteRecordImage).toHaveBeenCalledWith(7);
  });

  it("is a NotFoundError for a missing ancestry", async () => {
    db.findUnique.mockResolvedValue(null);

    await expect(deleteDhAncestryById(4)).rejects.toBeInstanceOf(NotFoundError);
    expect(db.remove).not.toHaveBeenCalled();
  });
});
