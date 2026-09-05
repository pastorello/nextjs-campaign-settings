import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { count, poiCount } = vi.hoisted(() => ({
  count: vi.fn(),
  poiCount: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { count }, poi: { count: poiCount } },
}));

import countUnpositionedPlaces from "./countUnpositionedPlaces";

describe("countUnpositionedPlaces (SPEC-007 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    count.mockResolvedValue(0);
    poiCount.mockResolvedValue(0);
  });

  it("counts every non-root place with no lat/lng", async () => {
    count.mockResolvedValue(42);

    await expect(countUnpositionedPlaces()).resolves.toBe(42);
    expect(count).toHaveBeenCalledWith({
      where: { lat: null, parentId: { not: null } },
    });
  });

  it("excludes the root by construction — the query never matches parentId: null", async () => {
    await countUnpositionedPlaces();

    const call = count.mock.calls[0]?.[0] as { where: { parentId: unknown } };
    expect(call.where.parentId).toEqual({ not: null });
  });

  it("counts unplaced landmarks too, not only zones (SPEC-017 T7)", async () => {
    count.mockResolvedValue(3);
    poiCount.mockResolvedValue(2);

    // The regression: the picker this number sits beside has listed
    // unplaced landmarks since the `zone`/`poi` split, so a zones-only
    // count reported three over a list of five.
    await expect(countUnpositionedPlaces()).resolves.toBe(5);
    expect(poiCount).toHaveBeenCalledWith({ where: { lat: null } });
  });

  it("does not exclude a root from the landmark half — a landmark always has a zone", async () => {
    poiCount.mockResolvedValue(1);

    await countUnpositionedPlaces();

    const call = poiCount.mock.calls[0]?.[0] as { where: unknown };
    expect(call.where).toEqual({ lat: null });
  });

  it("renders zero rather than throwing when every place is positioned", async () => {
    await expect(countUnpositionedPlaces()).resolves.toBe(0);
  });

  it("wraps a query failure as a DatabaseError", async () => {
    count.mockRejectedValue(new Error("connection reset"));

    await expect(countUnpositionedPlaces()).rejects.toBeInstanceOf(
      DatabaseError
    );
  });

  it("wraps a landmark-side failure too", async () => {
    poiCount.mockRejectedValue(new Error("connection reset"));

    await expect(countUnpositionedPlaces()).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
