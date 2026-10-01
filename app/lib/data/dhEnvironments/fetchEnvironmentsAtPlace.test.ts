import { beforeEach, describe, expect, it, vi } from "vitest";

const scope = vi.hoisted((): { current: object } => ({ current: {} }));
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve(scope.current),
}));
const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhEnvironment: { findMany } },
}));

import fetchEnvironmentsAtPlace from "./fetchEnvironmentsAtPlace";

describe("fetchEnvironmentsAtPlace (SPEC-028 §5.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.current = { kind: "all" };
    findMany.mockResolvedValue([{ id: 5, name: "Lamplit Market" }]);
  });

  it("lists the environments describing a place, for the DM", async () => {
    await expect(fetchEnvironmentsAtPlace(3)).resolves.toEqual([
      { id: 5, name: "Lamplit Market" },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { places: { some: { id: 3 } } } })
    );
  });

  it("gives a player none, even at a place they can see, without reading", async () => {
    scope.current = {
      kind: "campaign",
      campaignId: 7,
      zones: new Set([3]),
      pois: new Set(),
    };

    await expect(fetchEnvironmentsAtPlace(3)).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("reads nothing for an id that is not one", async () => {
    await expect(fetchEnvironmentsAtPlace(0)).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
