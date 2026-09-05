import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchZoneDescendantIds } = vi.hoisted(() => ({
  fetchZoneDescendantIds: vi.fn(),
}));
vi.mock("./fetchZoneDescendantIds", () => ({
  default: fetchZoneDescendantIds,
}));

import checkTreePlacement from "./checkTreePlacement";

/**
 * The tree used throughout, as `fetchZoneDescendantIds` would return it:
 *
 *   1 Terra
 *   └── 2 Regno di Kang
 *       └── 3 Skreebars
 *   └── 4 Piani Esterni
 */
describe("checkTreePlacement (SPEC-017 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses placing a place on its own map", async () => {
    fetchZoneDescendantIds.mockResolvedValue([1, 2, 3]);

    await expect(
      checkTreePlacement({ zoneId: 1, targetParentId: 1 })
    ).resolves.toEqual({
      parentId: ["A place cannot be placed on its own map."],
    });
  });

  it("refuses placing a place inside its own child", async () => {
    fetchZoneDescendantIds.mockResolvedValue([1, 2, 3]);

    await expect(
      checkTreePlacement({ zoneId: 1, targetParentId: 2 })
    ).resolves.toEqual({
      parentId: ["A place cannot be placed inside a place that it contains."],
    });
  });

  it("refuses placing a place inside a grandchild — the subtree, not just the children", async () => {
    fetchZoneDescendantIds.mockResolvedValue([1, 2, 3]);

    await expect(
      checkTreePlacement({ zoneId: 1, targetParentId: 3 })
    ).resolves.toEqual({
      parentId: ["A place cannot be placed inside a place that it contains."],
    });
  });

  it("allows placing a place onto a sibling's map", async () => {
    fetchZoneDescendantIds.mockResolvedValue([2, 3]);

    await expect(
      checkTreePlacement({ zoneId: 2, targetParentId: 4 })
    ).resolves.toBeNull();
  });

  it("allows placing a place back onto an ancestor's map — moving up is not a cycle", async () => {
    fetchZoneDescendantIds.mockResolvedValue([3]);

    await expect(
      checkTreePlacement({ zoneId: 3, targetParentId: 1 })
    ).resolves.toBeNull();
  });

  it("asks for the subtree of the place being moved, not of the target", async () => {
    fetchZoneDescendantIds.mockResolvedValue([2, 3]);

    await checkTreePlacement({ zoneId: 2, targetParentId: 4 });

    expect(fetchZoneDescendantIds).toHaveBeenCalledWith(2);
  });
});
