import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { findMany } },
}));

import fetchDerivedAncestry from "./fetchDerivedAncestry";

describe("fetchDerivedAncestry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a linked entity to its pin's ancestor chain", async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        title: "Terra",
        kind: "plane",
        parentId: null,
        linkedType: null,
        linkedId: null,
      },
      {
        id: 2,
        title: "Skreebars",
        kind: "city",
        parentId: 1,
        linkedType: null,
        linkedId: null,
      },
      {
        id: 3,
        title: "Dexter",
        kind: "npc",
        parentId: 2,
        linkedType: "npc",
        linkedId: 42,
      },
    ]);

    const result = await fetchDerivedAncestry("npc");

    expect(result.get(42)?.map((place) => place.title)).toEqual([
      "Skreebars",
      "Terra",
    ]);
  });

  it("wraps a query failure as a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchDerivedAncestry("npc")).rejects.toThrow();
  });
});
