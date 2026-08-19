import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const {
  findMany,
  zoneFindMany,
  npcFindMany,
  magicitemsFindMany,
  treasureFindMany,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  zoneFindMany: vi.fn(),
  npcFindMany: vi.fn(),
  magicitemsFindMany: vi.fn(),
  treasureFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    faction: { findMany },
    zone: { findMany: zoneFindMany },
    npc: { findMany: npcFindMany },
    magicitems: { findMany: magicitemsFindMany },
    treasure: { findMany: treasureFindMany },
  },
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

  it("maps zone rows to {value, label} keyed on title (SPEC-013 T6)", async () => {
    zoneFindMany.mockResolvedValue([{ id: 3, title: "Kang" }]);

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");
    const result = await fetchFieldOptions("zone");

    expect(result).toEqual([{ value: 3, label: "Kang" }]);
  });

  it("maps npc rows to {value, label} (SPEC-013 T6)", async () => {
    npcFindMany.mockResolvedValue([{ id: 9, name: "Old Marta" }]);

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");
    const result = await fetchFieldOptions("npc");

    expect(result).toEqual([{ value: 9, label: "Old Marta" }]);
  });

  it("maps magicitems rows to {value, label} (SPEC-013 T6)", async () => {
    magicitemsFindMany.mockResolvedValue([{ id: 4, name: "Ring of Warmth" }]);

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");
    const result = await fetchFieldOptions("magicitems");

    expect(result).toEqual([{ value: 4, label: "Ring of Warmth" }]);
  });

  it("maps treasure rows to {value, label} (SPEC-013 T6)", async () => {
    treasureFindMany.mockResolvedValue([{ id: 6, name: "Tharun d'argento" }]);

    const { default: fetchFieldOptions } = await import("./fetchFieldOptions");
    const result = await fetchFieldOptions("treasure");

    expect(result).toEqual([{ value: 6, label: "Tharun d'argento" }]);
  });
});
