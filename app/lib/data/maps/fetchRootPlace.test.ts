import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findFirst } },
}));

import fetchRootPlace from "./fetchRootPlace";

describe("fetchRootPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null on an empty installation", async () => {
    findFirst.mockResolvedValue(null);

    await expect(fetchRootPlace()).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { kind: "region", parentId: null },
      select: {
        id: true,
        title: true,
        mapImage: true,
        mapBounds: true,
        mapInitialView: true,
        mapInitialZoom: true,
      },
    });
  });

  it("returns the root once created", async () => {
    findFirst.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "uploaded-id.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });

    await expect(fetchRootPlace()).resolves.toEqual({
      id: 1,
      title: "Aerivel",
      mapImage: "uploaded-id.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });
  });

  it("passes through a stored map view (SPEC-004 M7)", async () => {
    findFirst.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "uploaded-id.png",
      mapBounds: [
        [0, 0],
        [500, 500],
      ],
      mapInitialView: [250, 250],
      mapInitialZoom: 2,
    });

    const result = await fetchRootPlace();

    expect(result?.mapBounds).toEqual([
      [0, 0],
      [500, 500],
    ]);
    expect(result?.mapInitialView).toEqual([250, 250]);
    expect(result?.mapInitialZoom).toBe(2);
  });

  // Defensive: today nothing can create a `kind: "region"`, `parentId: null`
  // row without a `mapImage` (createRootPlace requires one), but this reader
  // should not hand a broken `RootPlace` up to the page if that ever changes.
  it("treats a rootless row with no mapImage as no root", async () => {
    findFirst.mockResolvedValue({ id: 1, title: "Aerivel", mapImage: null });

    await expect(fetchRootPlace()).resolves.toBeNull();
  });
});
