import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import RecordImageOwner from "@/app/lib/definitions/types/RecordImageOwner";

// SPEC-020 T3 — every owning domain's save and delete, driven through one
// table: attach on save, delete the old image once a replace or remove has
// committed, delete the image with its record, and never touch an image when
// the write is refused or fails. `deleteRecordImage` (row + files) and
// `checkRecordImageReference` have their own tests; here they are mocks, so
// what is asserted is when each action calls them.

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteRecordImage, checkRecordImageReference } = vi.hoisted(() => ({
  deleteRecordImage: vi.fn<(id: number) => Promise<void>>(),
  checkRecordImageReference:
    vi.fn<
      (
        imageId: number | null | undefined,
        owner: RecordImageOwner
      ) => Promise<FieldErrors | null>
    >(),
}));
vi.mock("./deleteRecordImage", () => ({ default: deleteRecordImage }));
vi.mock("./checkRecordImageReference", () => ({
  default: checkRecordImageReference,
}));

const { models } = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });
  return {
    models: {
      npc: model(),
      deities: model(),
      magicitems: model(),
      treasure: model(),
      faction: model(),
      zone: model(),
      poi: model(),
      dhDomain: model(),
      // Counted before a domain's delete (SPEC-021 T2); zero here.
      dhDomainCard: model(),
      dhClass: model(),
    },
  };
});
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    ...models,
    $transaction: (writes: Promise<unknown>[]) => Promise.all(writes),
  },
}));

import updateNpc from "@/app/lib/data/npc/updateNpc";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";
import updateTreasure from "@/app/lib/data/treasure/updateTreasure";
import updateFaction from "@/app/lib/data/faction/updateFaction";
import updateZoneDetails from "@/app/lib/data/maps/updateZoneDetails";
import updateDhDomain from "@/app/lib/data/dhDomains/updateDhDomain";
import createNpc from "@/app/lib/data/npc/createNpc";
import { deleteNpcById } from "@/app/lib/data/npc/deleteNpcById";
import { deleteDeityById } from "@/app/lib/data/deities/deleteDeityById";
import { deleteMagicItemById } from "@/app/lib/data/magicitems/deleteMagicItemById";
import { deleteTreasureById } from "@/app/lib/data/treasure/deleteTreasureById";
import { deleteFactionById } from "@/app/lib/data/faction/deleteFactionById";
import deletePlace from "@/app/lib/data/maps/deletePlace";
import { deleteDhDomainById } from "@/app/lib/data/dhDomains/deleteDhDomainById";

type ModelName = keyof typeof models;

interface Owner {
  label: string;
  model: ModelName;
  relation: RecordImageOwner["relation"];
  update: (payload: {
    id: number;
    imageId?: number | null;
  }) => Promise<MutationResult>;
  remove: (id: number) => Promise<void>;
}

// The zone's save is a whole-form one: title and description always ride
// along (`updateZoneDetails`).
const zoneDetails = { title: "Kang", description: null };

const owners: Owner[] = [
  {
    label: "NPC",
    model: "npc",
    relation: "npc",
    update: (p) => updateNpc(p as never),
    remove: deleteNpcById,
  },
  {
    label: "deity",
    model: "deities",
    relation: "deity",
    update: (p) => updateDeity(p as never),
    remove: deleteDeityById,
  },
  {
    label: "magic item",
    model: "magicitems",
    relation: "magicItem",
    update: (p) => updateMagicItem(p as never),
    remove: deleteMagicItemById,
  },
  {
    label: "treasure",
    model: "treasure",
    relation: "treasure",
    update: (p) => updateTreasure(p as never),
    remove: deleteTreasureById,
  },
  {
    label: "faction",
    model: "faction",
    relation: "faction",
    update: (p) => updateFaction(p as never),
    remove: deleteFactionById,
  },
  {
    label: "place",
    model: "zone",
    relation: "zone",
    update: (p) => updateZoneDetails({ ...zoneDetails, ...p }),
    remove: deletePlace,
  },
  // SPEC-021 T2 — a Daggerheart domain's emblem.
  {
    label: "Daggerheart domain",
    model: "dhDomain",
    relation: "dhDomain",
    update: (p) => updateDhDomain(p as never),
    remove: deleteDhDomainById,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  checkRecordImageReference.mockResolvedValue(null);
  deleteRecordImage.mockResolvedValue(undefined);
  for (const model of Object.values(models)) {
    model.update.mockResolvedValue({});
    model.updateMany.mockResolvedValue({ count: 0 });
    model.delete.mockResolvedValue({});
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
  }
});

describe.each(owners)(
  "$label image lifecycle (SPEC-020 T3)",
  ({ model, relation, update, remove }) => {
    const table = () => models[model];

    it("rejects an unauthenticated save without touching any image", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      await expect(update({ id: 1, imageId: 4 })).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(table().update).not.toHaveBeenCalled();
      expect(deleteRecordImage).not.toHaveBeenCalled();
    });

    it("refuses a malformed image id before any lookup", async () => {
      const result = await update({ id: 1, imageId: -3 });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors.imageId).toBeDefined();
      expect(checkRecordImageReference).not.toHaveBeenCalled();
      expect(table().update).not.toHaveBeenCalled();
    });

    it("refuses an image the reference check rejects, writing nothing", async () => {
      checkRecordImageReference.mockResolvedValue({
        imageId: [{ key: "imageInUse" }],
      });

      const result = await update({ id: 1, imageId: 4 });

      expect(checkRecordImageReference).toHaveBeenCalledWith(4, {
        relation,
        id: 1,
      });
      expect(result).toEqual({
        ok: false,
        errors: { imageId: [{ key: "imageInUse" }] },
      });
      expect(table().update).not.toHaveBeenCalled();
      expect(deleteRecordImage).not.toHaveBeenCalled();
    });

    it("attaches a new image and deletes the one it replaces, after the save", async () => {
      table().findUnique.mockResolvedValue({ imageId: 3 });

      const result = await update({ id: 1, imageId: 4 });

      expect(result.ok).toBe(true);
      expect(table().update.mock.calls[0]?.[0]).toMatchObject({
        where: { id: 1 },
        data: { imageId: 4 },
      });
      expect(deleteRecordImage).toHaveBeenCalledWith(3);
      expect(table().update.mock.invocationCallOrder[0]).toBeLessThan(
        deleteRecordImage.mock.invocationCallOrder[0] ?? 0
      );
    });

    it("detaches and deletes a removed image", async () => {
      table().findUnique.mockResolvedValue({ imageId: 3 });

      await update({ id: 1, imageId: null });

      expect(table().update.mock.calls[0]?.[0]).toMatchObject({
        data: { imageId: null },
      });
      expect(deleteRecordImage).toHaveBeenCalledWith(3);
    });

    it("leaves the image alone when the save does not mention it", async () => {
      await update({ id: 1 });

      expect(table().findUnique).not.toHaveBeenCalled();
      expect(deleteRecordImage).not.toHaveBeenCalled();
    });

    it("keeps the previous image when the save fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      table().findUnique.mockResolvedValue({ imageId: 3 });
      table().update.mockRejectedValue(new Error("db down"));

      await expect(update({ id: 1, imageId: 4 })).rejects.toThrow();
      expect(deleteRecordImage).not.toHaveBeenCalled();
    });

    it("deletes the record's image with the record, after the delete", async () => {
      table().findUnique.mockResolvedValue({
        id: 1,
        name: "x",
        parentId: 2,
        imageId: 5,
      });

      await remove(1);

      expect(table().delete).toHaveBeenCalled();
      expect(deleteRecordImage).toHaveBeenCalledWith(5);
      expect(table().delete.mock.invocationCallOrder[0]).toBeLessThan(
        deleteRecordImage.mock.invocationCallOrder[0] ?? 0
      );
    });

    it("deletes no image for a record without one", async () => {
      table().findUnique.mockResolvedValue({
        id: 1,
        name: "x",
        parentId: 2,
        imageId: null,
      });

      await remove(1);

      expect(deleteRecordImage).not.toHaveBeenCalled();
    });

    it("keeps the image when the record delete fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      table().findUnique.mockResolvedValue({
        id: 1,
        name: "x",
        parentId: 2,
        imageId: 5,
      });
      table().delete.mockRejectedValue(new Error("db down"));

      await expect(remove(1)).rejects.toThrow();
      expect(deleteRecordImage).not.toHaveBeenCalled();
    });
  }
);

describe("createNpc image (SPEC-020 T3) — the creates share this shape", () => {
  const npc = {
    name: "Elminster",
    description: "",
    title: "",
    alignment: 1,
    alignmentDomain: 1,
    position: "",
    faction: null,
    appearance: "",
    personality: "",
    motivations: "",
    secrets: "",
  };

  it("attaches an uploaded image", async () => {
    models.npc.create.mockResolvedValue({});

    const result = await createNpc({ ...npc, id: 0, imageId: 4 });

    expect(result.ok).toBe(true);
    expect(checkRecordImageReference).toHaveBeenCalledWith(4, {
      relation: "npc",
    });
    expect(models.npc.create.mock.calls[0]?.[0]).toMatchObject({
      data: { imageId: 4 },
    });
  });

  it("refuses an image the reference check rejects, creating nothing", async () => {
    checkRecordImageReference.mockResolvedValue({
      imageId: [{ key: "imageNotFound" }],
    });

    const result = await createNpc({ ...npc, id: 0, imageId: 4 });

    expect(result.ok).toBe(false);
    expect(models.npc.create).not.toHaveBeenCalled();
  });
});
