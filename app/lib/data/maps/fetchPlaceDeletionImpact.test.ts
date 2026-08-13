import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { zoneCount, poiCount, npcCount, deitiesCount } = vi.hoisted(() => ({
  zoneCount: vi.fn(),
  poiCount: vi.fn(),
  npcCount: vi.fn(),
  deitiesCount: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { count: zoneCount },
    poi: { count: poiCount },
    npc: { count: npcCount },
    deities: { count: deitiesCount },
  },
}));

import fetchPlaceDeletionImpact from "./fetchPlaceDeletionImpact";

describe("fetchPlaceDeletionImpact (SPEC-010 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    zoneCount.mockResolvedValue(0);
    poiCount.mockResolvedValue(0);
    npcCount.mockResolvedValue(0);
    deitiesCount.mockResolvedValue(0);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchPlaceDeletionImpact(5)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(zoneCount).not.toHaveBeenCalled();
  });

  it("sums direct child zones and landmarks into placeCount", async () => {
    zoneCount.mockResolvedValue(28);
    poiCount.mockResolvedValue(3);

    const result = await fetchPlaceDeletionImpact(5);

    expect(result.placeCount).toBe(31);
    expect(zoneCount).toHaveBeenCalledWith({ where: { parentId: 5 } });
    expect(poiCount).toHaveBeenCalledWith({ where: { zoneId: 5 } });
  });

  it("counts only entities assigned directly to the place, not via a landmark", async () => {
    npcCount.mockResolvedValue(43);
    deitiesCount.mockResolvedValue(2);

    const result = await fetchPlaceDeletionImpact(5);

    expect(result.npcCount).toBe(43);
    expect(result.deityCount).toBe(2);
    expect(npcCount).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
    });
    expect(deitiesCount).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
    });
  });

  it("reports all zeroes for a place with no children and no entities", async () => {
    const result = await fetchPlaceDeletionImpact(5);

    expect(result).toEqual({ placeCount: 0, npcCount: 0, deityCount: 0 });
  });

  it("wraps a query failure in a DatabaseError", async () => {
    zoneCount.mockRejectedValue(new Error("connection lost"));

    await expect(fetchPlaceDeletionImpact(5)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
