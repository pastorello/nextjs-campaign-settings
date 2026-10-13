import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findMany } },
}));

import fetchArchivedCampaigns from "./fetchArchivedCampaigns";

describe("fetchArchivedCampaigns (SPEC-032 T4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads only the system's archived campaigns, latest first", async () => {
    findMany.mockResolvedValue([]);

    await fetchArchivedCampaigns("daggerheart");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { system: "daggerheart", archivedAt: { not: null } },
        orderBy: [{ archivedAt: "desc" }, { id: "asc" }],
      })
    );
  });

  it("returns each with the day it was put away", async () => {
    const archivedAt = new Date("2026-10-01T10:00:00Z");
    findMany.mockResolvedValue([{ id: 2, title: "Old group", archivedAt }]);

    await expect(fetchArchivedCampaigns("dnd5e")).resolves.toEqual([
      { id: 2, title: "Old group", archivedAt },
    ]);
  });

  it("wraps a database failure", async () => {
    findMany.mockRejectedValue(new Error("down"));

    await expect(fetchArchivedCampaigns("dnd5e")).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
