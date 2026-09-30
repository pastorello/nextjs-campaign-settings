import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { npcCount, deitiesCount } = vi.hoisted(() => ({
  npcCount: vi.fn(),
  deitiesCount: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    npc: { count: npcCount },
    deities: { count: deitiesCount },
  },
}));

import fetchLandmarkDeletionImpact from "./fetchLandmarkDeletionImpact";

describe("fetchLandmarkDeletionImpact (SPEC-023, after TD-147)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    npcCount.mockResolvedValue(0);
    deitiesCount.mockResolvedValue(0);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchLandmarkDeletionImpact(7)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(npcCount).not.toHaveBeenCalled();
  });

  it("counts the NPCs and deities assigned to the landmark — the rows deletePoi detaches", async () => {
    npcCount.mockResolvedValue(3);
    deitiesCount.mockResolvedValue(1);

    const result = await fetchLandmarkDeletionImpact(7);

    expect(result).toEqual({ npcCount: 3, deityCount: 1 });
    expect(npcCount).toHaveBeenCalledWith({ where: { poiId: 7 } });
    expect(deitiesCount).toHaveBeenCalledWith({ where: { poiId: 7 } });
  });

  it("wraps a database failure in a DatabaseError", async () => {
    npcCount.mockRejectedValue(new Error("connection lost"));

    await expect(fetchLandmarkDeletionImpact(7)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
