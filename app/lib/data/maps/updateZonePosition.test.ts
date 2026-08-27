import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, updateMany, findUnique, findMany, poiFindMany } = vi.hoisted(
  () => ({
    update: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    poiFindMany: vi.fn(),
  })
);
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { update, updateMany, findUnique, findMany },
    poi: { findMany: poiFindMany },
  },
}));

import updateZonePosition from "./updateZonePosition";

describe("updateZonePosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    poiFindMany.mockResolvedValue([]);
    update.mockResolvedValue({});
    updateMany.mockResolvedValue({ count: 1 });
  });

  describe("point moves", () => {
    it("moves an ordinary pin with no containing sibling area", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([]);

      const result = await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "reposition",
      });

      expect(result).toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { lat: 20, lng: 20 },
      });
    });

    it("refuses moving a pin into an existing sibling area (SPEC-009 §8's documented gap)", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([
        {
          title: "Kang",
          footprint: [
            [10, 10],
            [50, 50],
          ],
        },
      ]);

      const result = await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "reposition",
      });

      expect(result).toEqual({
        ok: false,
        errors: { lat: ["This point is inside an existing area: Kang."] },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("excludes its own row from the sibling query", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([]);

      await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "reposition",
      });

      expect(findMany).toHaveBeenCalledWith({
        where: { parentId: 1, id: { not: 5 } },
        select: { title: true, footprint: true },
      });
    });

    it("places an unpositioned place through a guarded write (TD-93)", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([]);

      const result = await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "place",
      });

      expect(result).toEqual({ ok: true });
      // The pre-state is in the `where`, not in an earlier read: that is
      // what makes the database the thing refusing a second placement.
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: 5, lat: null },
        data: { lat: 20, lng: 20 },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("refuses placing a place that already has coordinates (TD-93)", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([]);
      updateMany.mockResolvedValue({ count: 0 });

      const result = await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "place",
      });

      expect(result).toEqual({
        ok: false,
        code: "alreadyPlaced",
        errors: {
          lat: [
            "This place is already positioned. Move it back to the unpositioned places first.",
          ],
        },
      });
    });

    it("repositioning the same already-placed row is not refused (SPEC-005)", async () => {
      findUnique.mockResolvedValue({ parentId: 1 });
      findMany.mockResolvedValue([]);
      updateMany.mockResolvedValue({ count: 0 });

      const result = await updateZonePosition({
        id: 5,
        lat: 20,
        lng: 20,
        intent: "reposition",
      });

      expect(result).toEqual({ ok: true });
      expect(updateMany).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { lat: 20, lng: 20 },
      });
    });

    it("says a missing row is missing rather than already placed", async () => {
      findUnique.mockResolvedValue(null);

      const result = await updateZonePosition({
        id: 404,
        lat: 20,
        lng: 20,
        intent: "place",
      });

      expect(result).toEqual({
        ok: false,
        errors: { id: ["This place does not exist."] },
      });
      expect(updateMany).not.toHaveBeenCalled();
    });

    it("skips the sibling check for the root (no parent)", async () => {
      findUnique.mockResolvedValue({ parentId: null });

      const result = await updateZonePosition({
        id: 1,
        lat: 20,
        lng: 20,
        intent: "reposition",
      });

      expect(result).toEqual({ ok: true });
      expect(findMany).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lat: 20, lng: 20 },
      });
    });
  });

  describe("area resize/move", () => {
    const footprint: [[number, number], [number, number]] = [
      [10, 10],
      [60, 60],
    ];

    beforeEach(() => {
      findUnique.mockImplementation((args: { where: { id: number } }) => {
        if (args.where.id === 7) return Promise.resolve({ parentId: 1 });
        return Promise.resolve({
          mapBounds: [
            [0, 0],
            [100, 100],
          ],
        });
      });
    });

    it("does not refuse a resize against its own unchanged footprint (the self-exclusion trap)", async () => {
      // Without `excludeZoneId`, the sibling query returns the row being
      // resized, `findOverlappingSibling` finds it overlapping itself, and
      // every resize would be refused.
      findMany.mockImplementation(
        (args: { where: { parentId: number; id?: { not: number } } }) => {
          const rows = [
            {
              id: 7,
              title: "Kang",
              lat: 30,
              lng: 30,
              footprint: [
                [10, 10],
                [50, 50],
              ],
            },
          ];
          return Promise.resolve(
            rows.filter((row) => row.id !== args.where.id?.not)
          );
        }
      );

      const result = await updateZonePosition({ id: 7, footprint });

      expect(result).toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { lat: 35, lng: 35, footprint },
      });
    });

    it("refuses a resize that would swallow a sibling pin", async () => {
      findMany.mockImplementation(
        (args: { where: { parentId: number; id?: { not: number } } }) => {
          const rows = [
            {
              id: 7,
              title: "Kang",
              lat: 30,
              lng: 30,
              footprint: [
                [10, 10],
                [50, 50],
              ],
            },
            { id: 9, title: "Skreebars", lat: 55, lng: 55, footprint: null },
          ];
          return Promise.resolve(
            rows.filter((row) => row.id !== args.where.id?.not)
          );
        }
      );

      const result = await updateZonePosition({ id: 7, footprint });

      expect(result).toEqual({
        ok: false,
        errors: { footprint: ["Would cover existing place(s): Skreebars."] },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("refuses a resize that would overlap a sibling area", async () => {
      findMany.mockImplementation(
        (args: { where: { parentId: number; id?: { not: number } } }) => {
          const rows = [
            {
              id: 7,
              title: "Kang",
              lat: 30,
              lng: 30,
              footprint: [
                [10, 10],
                [50, 50],
              ],
            },
            {
              id: 8,
              title: "Orc Kingdom",
              lat: 70,
              lng: 70,
              footprint: [
                [55, 55],
                [90, 90],
              ],
            },
          ];
          return Promise.resolve(
            rows.filter((row) => row.id !== args.where.id?.not)
          );
        }
      );

      const result = await updateZonePosition({ id: 7, footprint });

      expect(result).toEqual({
        ok: false,
        errors: { footprint: ["Overlaps an existing area: Orc Kingdom."] },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("refuses resizing the root into an area", async () => {
      findUnique.mockResolvedValue({ parentId: null });

      const result = await updateZonePosition({ id: 1, footprint });

      expect(result).toEqual({
        ok: false,
        errors: {
          footprint: ["The root place has no parent to draw an area against."],
        },
      });
      expect(update).not.toHaveBeenCalled();
    });
  });
});
