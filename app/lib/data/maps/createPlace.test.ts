import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create, findMany, findUnique, poiFindMany } = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  poiFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { create, findMany, findUnique },
    poi: { findMany: poiFindMany },
  },
}));

import createPlace from "./createPlace";

const commonFields = { title: "Somewhere", lat: 10, lng: 20, parentId: 1 };

describe("createPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([]);
    findUnique.mockResolvedValue({
      mapBounds: [
        [0, 0],
        [100, 100],
      ],
    });
  });

  it("creates a region with its map image", async () => {
    create.mockResolvedValue({ id: 42 });

    const result = await createPlace({
      ...commonFields,
      kind: "region",
      mapImage: "kang.png",
    });

    expect(result).toEqual({ ok: true, id: 42 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "region",
        parentId: 1,
        mapImage: "kang.png",
      },
    });
  });

  it("creates a city with its map image (T2)", async () => {
    create.mockResolvedValue({ id: 43 });

    const result = await createPlace({
      ...commonFields,
      kind: "city",
      mapImage: "skreebars.png",
    });

    expect(result).toEqual({ ok: true, id: 43 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "city",
        parentId: 1,
        mapImage: "skreebars.png",
      },
    });
  });

  it("rejects a kind: deity payload, without writing — removed by SPEC-008 T5", async () => {
    const result = await createPlace({
      ...commonFields,
      kind: "deity",
      linkedType: "deity",
      linkedId: 3,
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a place with no parent, without writing", async () => {
    const result = await createPlace({
      title: "Somewhere",
      lat: 10,
      lng: 20,
      kind: "region",
      mapImage: "kang.png",
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a region with no map image, without writing", async () => {
    const result = await createPlace({
      ...commonFields,
      kind: "region",
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  describe("SPEC-009 — a point under a parent with existing areas", () => {
    it("rejects a point falling inside a sibling area, naming it", async () => {
      findMany.mockResolvedValue([
        {
          title: "Kang",
          lat: 5,
          lng: 5,
          footprint: [
            [0, 0],
            [10, 10],
          ],
        },
      ]);

      const result = await createPlace({
        ...commonFields,
        lat: 5,
        lng: 5,
        kind: "city",
        mapImage: "skreebars.png",
      });

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.lat?.[0]).toContain("Kang");
      }
    });
  });

  describe("SPEC-009 — drawing an area (footprint present)", () => {
    const areaFields = {
      ...commonFields,
      kind: "region" as const,
      mapImage: "kang.png",
      footprint: [
        [0, 0],
        [10, 20],
      ] as [[number, number], [number, number]],
    };

    it("persists the footprint and derives lat/lng from its centre, ignoring the sent coordinates", async () => {
      create.mockResolvedValue({ id: 99 });

      const result = await createPlace(areaFields);

      expect(result).toEqual({ ok: true, id: 99 });
      expect(create).toHaveBeenCalledWith({
        data: {
          title: "Somewhere",
          lat: 5,
          lng: 10,
          kind: "region",
          parentId: 1,
          mapImage: "kang.png",
          footprint: areaFields.footprint,
        },
      });
    });

    it("rejects a degenerate area relative to the parent map's extent, without writing", async () => {
      findUnique.mockResolvedValue({
        mapBounds: [
          [0, 0],
          [100, 100],
        ],
      });

      const result = await createPlace({
        ...areaFields,
        footprint: [
          [0, 0],
          [0.5, 0.5],
        ],
      });

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
    });

    it("rejects an area overlapping a sibling area, naming it", async () => {
      findMany.mockResolvedValue([
        {
          title: "Skreebars",
          lat: 5,
          lng: 15,
          footprint: [
            [5, 15],
            [15, 25],
          ],
        },
      ]);

      const result = await createPlace(areaFields);

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.footprint?.[0]).toContain("Skreebars");
      }
    });

    it("allows an area that merely touches a sibling's edge", async () => {
      create.mockResolvedValue({ id: 100 });
      findMany.mockResolvedValue([
        {
          title: "Neighbour",
          lat: 5,
          lng: 25,
          footprint: [
            [0, 20],
            [10, 30],
          ],
        },
      ]);

      const result = await createPlace(areaFields);

      expect(result).toEqual({ ok: true, id: 100 });
      expect(create).toHaveBeenCalled();
    });

    it("rejects an area swallowing an existing point-zone pin, naming it", async () => {
      findMany.mockResolvedValue([
        { title: "Village", lat: 5, lng: 10, footprint: null },
      ]);

      const result = await createPlace(areaFields);

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.footprint?.[0]).toContain("Village");
      }
    });

    it("rejects an area swallowing an existing landmark, naming it", async () => {
      poiFindMany.mockResolvedValue([{ title: "Shrine", lat: 5, lng: 10 }]);

      const result = await createPlace(areaFields);

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.footprint?.[0]).toContain("Shrine");
      }
    });

    it("rejects an area swallowing multiple pins, naming all of them", async () => {
      findMany.mockResolvedValue([
        { title: "Village A", lat: 2, lng: 5, footprint: null },
        { title: "Village B", lat: 8, lng: 18, footprint: null },
      ]);

      const result = await createPlace(areaFields);

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.footprint?.[0]).toContain("Village A");
        expect(result.errors.footprint?.[0]).toContain("Village B");
      }
    });

    it("rejects an area with a pin exactly on its edge", async () => {
      findMany.mockResolvedValue([
        { title: "Border Post", lat: 10, lng: 10, footprint: null },
      ]);

      const result = await createPlace(areaFields);

      expect(result.ok).toBe(false);
      expect(create).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.errors.footprint?.[0]).toContain("Border Post");
      }
    });
  });
});
