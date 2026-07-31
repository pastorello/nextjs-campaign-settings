import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { spells: { findMany } },
}));

const validRow = {
  id: 1,
  name: "Aiuto",
  description: "desc",
  level: 2,
  circle: [1],
  classes: [1],
  castingTime: "1Azione",
  range: "30",
  components: "V,S,M",
  duration: "8 ore",
  savingThrow: "Nessuno",
  ritual: false,
  concentration: null,
  upcast: "",
};

describe("fetchFilteredSpells (TD-02b)", () => {
  it("returns rows, defaulting a nullable column to its declared default", async () => {
    findMany.mockResolvedValue([validRow]);

    const { fetchFilteredSpells } = await import("./fetchFilteredSpells");
    const result = await fetchFilteredSpells(Promise.resolve({}));

    expect(result).toHaveLength(1);
    expect(result[0]?.concentration).toBe(false);
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...validRow, level: "not-a-number" }]);

    const { fetchFilteredSpells } = await import("./fetchFilteredSpells");

    await expect(fetchFilteredSpells(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });
});
