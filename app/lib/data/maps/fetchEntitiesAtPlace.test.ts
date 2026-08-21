import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { npcFindMany, deitiesFindMany } = vi.hoisted(() => ({
  npcFindMany: vi.fn(),
  deitiesFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    npc: { findMany: npcFindMany },
    deities: { findMany: deitiesFindMany },
  },
}));

import fetchEntitiesAtPlace from "./fetchEntitiesAtPlace";

describe("fetchEntitiesAtPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    npcFindMany.mockResolvedValue([]);
    deitiesFindMany.mockResolvedValue([]);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchEntitiesAtPlace({ zoneId: 5 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(npcFindMany).not.toHaveBeenCalled();
  });

  it("queries entities attached directly to a zone, excluding landmark attachments", async () => {
    await fetchEntitiesAtPlace({ zoneId: 5 });

    expect(npcFindMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    expect(deitiesFindMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });

  it("queries entities attached to a landmark, not its zone", async () => {
    await fetchEntitiesAtPlace({ poiId: 9 });

    expect(npcFindMany).toHaveBeenCalledWith({
      where: { poiId: 9 },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    expect(deitiesFindMany).toHaveBeenCalledWith({
      where: { poiId: 9 },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });

  it("merges NPCs and deities into one list, tagged with their type", async () => {
    npcFindMany.mockResolvedValue([{ id: 1, name: "Ariosto" }]);
    deitiesFindMany.mockResolvedValue([{ id: 3, name: "Aerivel" }]);

    const result = await fetchEntitiesAtPlace({ zoneId: 5 });

    expect(result).toEqual([
      { id: 1, name: "Ariosto", type: "npc" },
      { id: 3, name: "Aerivel", type: "deity" },
    ]);
  });

  it("returns an empty list for a place with no entities", async () => {
    const result = await fetchEntitiesAtPlace({ zoneId: 5 });

    expect(result).toEqual([]);
  });

  it("wraps a query failure in a DatabaseError", async () => {
    npcFindMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchEntitiesAtPlace({ zoneId: 5 })).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
