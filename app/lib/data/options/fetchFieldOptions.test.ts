import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { faction: { findMany } },
}));

describe("fetchFieldOptions (SPEC-006 T6)", () => {
  it("maps rows to {value, label} sorted by name", async () => {
    findMany.mockResolvedValue([
      { id: 2, name: "Annunaki" },
      { id: 23, name: "Regno di Kang" },
    ]);

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");
    const result = await fetchFieldOptions("faction");

    expect(result).toEqual([
      { value: 2, label: "Annunaki" },
      { value: 23, label: "Regno di Kang" },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } })
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");

    await expect(fetchFieldOptions("faction")).rejects.toThrow(DatabaseError);
  });
});
