import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { recordImage, store } = vi.hoisted(() => ({
  recordImage: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  store: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { recordImage },
}));
vi.mock("@/app/lib/storage/defaultRecordImageStore", () => ({
  default: store,
}));

import createRecordImage from "./createRecordImage";
import deleteRecordImage from "./deleteRecordImage";
import releaseReplacedRecordImage from "./releaseReplacedRecordImage";
import checkRecordImageReference from "./checkRecordImageReference";

const stored = {
  displayKey: "display.webp",
  thumbKey: "thumb.webp",
  mimeType: "image/webp",
  width: 1600,
  height: 900,
};

const noHolders = {
  npc: null,
  deity: null,
  magicItem: null,
  treasure: null,
  faction: null,
  zone: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  store.delete.mockResolvedValue(undefined);
});

describe("createRecordImage (SPEC-020 T3)", () => {
  it("inserts the stored image and returns the row id", async () => {
    recordImage.create.mockResolvedValue({ id: 12 });

    await expect(createRecordImage(stored, store)).resolves.toBe(12);
    expect(recordImage.create).toHaveBeenCalledWith({
      data: stored,
      select: { id: true },
    });
    expect(store.delete).not.toHaveBeenCalled();
  });

  it("deletes both files again when the insert fails, leaving no orphan", async () => {
    recordImage.create.mockRejectedValue(new Error("db down"));

    await expect(createRecordImage(stored, store)).resolves.toBeNull();
    expect(store.delete).toHaveBeenCalledWith("display.webp");
    expect(store.delete).toHaveBeenCalledWith("thumb.webp");
  });

  it("still answers null when the cleanup deletes fail too", async () => {
    recordImage.create.mockRejectedValue(new Error("db down"));
    store.delete.mockRejectedValue(new Error("disk gone"));

    await expect(createRecordImage(stored, store)).resolves.toBeNull();
    expect(store.delete).toHaveBeenCalledTimes(2);
  });
});

describe("deleteRecordImage (SPEC-020 §5.6)", () => {
  it("deletes the row, then both files", async () => {
    recordImage.findUnique.mockResolvedValue({
      displayKey: "display.webp",
      thumbKey: "thumb.webp",
    });
    recordImage.delete.mockResolvedValue({});

    await deleteRecordImage(5);

    expect(recordImage.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(store.delete).toHaveBeenCalledWith("display.webp");
    expect(store.delete).toHaveBeenCalledWith("thumb.webp");
    expect(recordImage.delete.mock.invocationCallOrder[0]).toBeLessThan(
      store.delete.mock.invocationCallOrder[0] ?? 0
    );
  });

  it("is a no-op for an id that names no image", async () => {
    recordImage.findUnique.mockResolvedValue(null);

    await deleteRecordImage(5);

    expect(recordImage.delete).not.toHaveBeenCalled();
    expect(store.delete).not.toHaveBeenCalled();
  });

  it("never throws: the record's own change has already committed", async () => {
    recordImage.findUnique.mockResolvedValue({
      displayKey: "display.webp",
      thumbKey: "thumb.webp",
    });
    recordImage.delete.mockResolvedValue({});
    store.delete.mockRejectedValue(new Error("disk gone"));

    await expect(deleteRecordImage(5)).resolves.toBeUndefined();

    recordImage.delete.mockRejectedValue(new Error("db down"));
    await expect(deleteRecordImage(5)).resolves.toBeUndefined();
  });

  it("keeps the files when the row cannot be deleted", async () => {
    recordImage.findUnique.mockResolvedValue({
      displayKey: "display.webp",
      thumbKey: "thumb.webp",
    });
    recordImage.delete.mockRejectedValue(new Error("db down"));

    await deleteRecordImage(5);

    expect(store.delete).not.toHaveBeenCalled();
  });
});

describe("releaseReplacedRecordImage", () => {
  const prime = () => {
    recordImage.findUnique.mockResolvedValue({
      displayKey: "d",
      thumbKey: "t",
    });
    recordImage.delete.mockResolvedValue({});
  };

  it.each([
    ["replaced", 3, 4],
    ["removed", 3, null],
  ])("deletes the previous image when %s", async (_case, previous, next) => {
    prime();

    await releaseReplacedRecordImage(previous, next);

    expect(recordImage.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it.each([
    ["there was no image", null, 4],
    ["the image was kept", 3, 3],
    ["the payload did not mention the field", 3, undefined],
  ])("does nothing when %s", async (_case, previous, next) => {
    prime();

    await releaseReplacedRecordImage(previous, next);

    expect(recordImage.findUnique).not.toHaveBeenCalled();
    expect(recordImage.delete).not.toHaveBeenCalled();
  });
});

describe("checkRecordImageReference", () => {
  it("does not query when nothing is being attached", async () => {
    await expect(
      checkRecordImageReference(null, { relation: "npc", id: 1 })
    ).resolves.toBeNull();
    await expect(
      checkRecordImageReference(undefined, { relation: "npc" })
    ).resolves.toBeNull();
    expect(recordImage.findUnique).not.toHaveBeenCalled();
  });

  it("refuses an id that names no image", async () => {
    recordImage.findUnique.mockResolvedValue(null);

    await expect(
      checkRecordImageReference(9, { relation: "npc", id: 1 })
    ).resolves.toEqual({ imageId: [{ key: "imageNotFound" }] });
  });

  it("accepts an unclaimed image", async () => {
    recordImage.findUnique.mockResolvedValue(noHolders);

    await expect(
      checkRecordImageReference(9, { relation: "npc" })
    ).resolves.toBeNull();
  });

  it("accepts the image the record already carries", async () => {
    recordImage.findUnique.mockResolvedValue({ ...noHolders, npc: { id: 1 } });

    await expect(
      checkRecordImageReference(9, { relation: "npc", id: 1 })
    ).resolves.toBeNull();
  });

  it.each([
    ["another record of the same kind", { npc: { id: 2 } }],
    ["a record of another kind with the same id", { deity: { id: 1 } }],
  ])("refuses an image held by %s", async (_case, holder) => {
    recordImage.findUnique.mockResolvedValue({ ...noHolders, ...holder });

    await expect(
      checkRecordImageReference(9, { relation: "npc", id: 1 })
    ).resolves.toEqual({ imageId: [{ key: "imageInUse" }] });
  });

  it("refuses any held image on a create, which has no id yet", async () => {
    recordImage.findUnique.mockResolvedValue({
      ...noHolders,
      zone: { id: 4 },
    });

    await expect(
      checkRecordImageReference(9, { relation: "zone" })
    ).resolves.toEqual({ imageId: [{ key: "imageInUse" }] });
  });

  it("reports a failed lookup as a database error", async () => {
    recordImage.findUnique.mockRejectedValue(new Error("db down"));

    await expect(
      checkRecordImageReference(9, { relation: "npc", id: 1 })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
