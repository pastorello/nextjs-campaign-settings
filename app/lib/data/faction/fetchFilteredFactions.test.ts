import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";
import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { faction: { findMany } },
}));

const validRow: Record<string, unknown> = { id: 1 };
for (const key of entityFieldKeys(PageType.Faction)) {
  validRow[key] = fieldMeta[key]?.defaultValue;
}

describe("fetchFilteredFactions (SPEC-006 T2)", () => {
  it("returns rows for a well-formed result set", async () => {
    findMany.mockResolvedValue([validRow]);

    const { fetchFilteredFactions } = await import("./fetchFilteredFactions");
    const result = await fetchFilteredFactions(Promise.resolve({}));

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("falls back to the declared default for a null description column", async () => {
    findMany.mockResolvedValue([{ ...validRow, description: null }]);

    const { fetchFilteredFactions } = await import("./fetchFilteredFactions");
    const result = await fetchFilteredFactions(Promise.resolve({}));

    expect(result[0]?.description).toBe(fieldMeta.description?.defaultValue);
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...validRow, id: "not-a-number" }]);

    const { fetchFilteredFactions } = await import("./fetchFilteredFactions");

    await expect(fetchFilteredFactions(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { fetchFilteredFactions } = await import("./fetchFilteredFactions");

    await expect(fetchFilteredFactions(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });
});
