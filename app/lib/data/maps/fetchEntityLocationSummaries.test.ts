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

import fetchEntityLocationSummaries from "./fetchEntityLocationSummaries";

describe("fetchEntityLocationSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchEntityLocationSummaries("npc")).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(npcFindMany).not.toHaveBeenCalled();
  });

  it("resolves the poi's title over the zone's when both are set", async () => {
    npcFindMany.mockResolvedValue([
      {
        id: 1,
        zoneId: 5,
        poiId: 9,
        zone: { title: "Skreebars" },
        poi: { title: "Locanda del Cinghiale Rosso" },
      },
    ]);

    const result = await fetchEntityLocationSummaries("npc");

    expect(result.get(1)).toEqual({
      zoneId: 5,
      poiId: 9,
      title: "Locanda del Cinghiale Rosso",
    });
  });

  it("falls back to the zone's title when no poi is set", async () => {
    npcFindMany.mockResolvedValue([
      {
        id: 2,
        zoneId: 5,
        poiId: null,
        zone: { title: "Skreebars" },
        poi: null,
      },
    ]);

    const result = await fetchEntityLocationSummaries("npc");

    expect(result.get(2)).toEqual({
      zoneId: 5,
      poiId: null,
      title: "Skreebars",
    });
  });

  it("resolves a null title when nothing is assigned", async () => {
    npcFindMany.mockResolvedValue([
      { id: 3, zoneId: null, poiId: null, zone: null, poi: null },
    ]);

    const result = await fetchEntityLocationSummaries("npc");

    expect(result.get(3)).toEqual({
      zoneId: null,
      poiId: null,
      title: null,
    });
  });

  it("reads deities when asked for that linkedType", async () => {
    deitiesFindMany.mockResolvedValue([
      { id: 7, zoneId: null, poiId: null, zone: null, poi: null },
    ]);

    await fetchEntityLocationSummaries("deity");

    expect(deitiesFindMany).toHaveBeenCalled();
    expect(npcFindMany).not.toHaveBeenCalled();
  });

  it("wraps a query failure in a DatabaseError", async () => {
    npcFindMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchEntityLocationSummaries("npc")).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
