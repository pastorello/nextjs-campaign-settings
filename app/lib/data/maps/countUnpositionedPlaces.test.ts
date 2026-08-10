import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { count } = vi.hoisted(() => ({ count: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { count } },
}));

import countUnpositionedPlaces from "./countUnpositionedPlaces";

describe("countUnpositionedPlaces (SPEC-007 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts every non-root place with no lat/lng", async () => {
    count.mockResolvedValue(42);

    await expect(countUnpositionedPlaces()).resolves.toBe(42);
    expect(count).toHaveBeenCalledWith({
      where: { lat: null, parentId: { not: null } },
    });
  });

  it("excludes the root by construction — the query never matches parentId: null", async () => {
    count.mockResolvedValue(0);

    await countUnpositionedPlaces();

    const call = count.mock.calls[0]?.[0] as { where: { parentId: unknown } };
    expect(call.where.parentId).toEqual({ not: null });
  });

  it("renders zero rather than throwing when every place is positioned", async () => {
    count.mockResolvedValue(0);

    await expect(countUnpositionedPlaces()).resolves.toBe(0);
  });

  it("wraps a query failure as a DatabaseError", async () => {
    count.mockRejectedValue(new Error("connection reset"));

    await expect(countUnpositionedPlaces()).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
