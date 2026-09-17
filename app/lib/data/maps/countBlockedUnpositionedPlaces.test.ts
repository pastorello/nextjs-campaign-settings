import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { count, poiCount } = vi.hoisted(() => ({
  count: vi.fn(),
  poiCount: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { count }, poi: { count: poiCount } },
}));

import countBlockedUnpositionedPlaces from "./countBlockedUnpositionedPlaces";

describe("countBlockedUnpositionedPlaces (TD-79)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    count.mockResolvedValue(0);
    poiCount.mockResolvedValue(0);
  });

  it("counts unpositioned zones whose own parent has no map", async () => {
    count.mockResolvedValue(2);

    await expect(countBlockedUnpositionedPlaces()).resolves.toBe(2);
    expect(count).toHaveBeenCalledWith({
      where: {
        lat: null,
        parentId: { not: null },
        parent: { mapImage: null },
      },
    });
  });

  it("counts unpositioned landmarks whose own zone has no map", async () => {
    poiCount.mockResolvedValue(3);

    await expect(countBlockedUnpositionedPlaces()).resolves.toBe(3);
    expect(poiCount).toHaveBeenCalledWith({
      where: { lat: null, zone: { mapImage: null } },
    });
  });

  it("sums both halves", async () => {
    count.mockResolvedValue(2);
    poiCount.mockResolvedValue(3);

    await expect(countBlockedUnpositionedPlaces()).resolves.toBe(5);
  });

  it("renders zero rather than throwing when nothing is blocked", async () => {
    await expect(countBlockedUnpositionedPlaces()).resolves.toBe(0);
  });

  it("wraps a query failure as a DatabaseError", async () => {
    count.mockRejectedValue(new Error("connection reset"));

    await expect(countBlockedUnpositionedPlaces()).rejects.toBeInstanceOf(
      DatabaseError
    );
  });

  it("wraps a landmark-side failure too", async () => {
    poiCount.mockRejectedValue(new Error("connection reset"));

    await expect(countBlockedUnpositionedPlaces()).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
