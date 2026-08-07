import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { findMany } },
}));

import fetchDerivedLocations from "./fetchDerivedLocations";

describe("fetchDerivedLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a linked entity to its pin's parent title", async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        title: "Skreebars",
        parentId: null,
        linkedType: null,
        linkedId: null,
      },
      { id: 2, title: "Dexter", parentId: 1, linkedType: "npc", linkedId: 42 },
    ]);

    const result = await fetchDerivedLocations("npc");

    expect(result.get(42)).toBe("Skreebars");
  });

  it("wraps a query failure as a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchDerivedLocations("npc")).rejects.toThrow();
  });
});
