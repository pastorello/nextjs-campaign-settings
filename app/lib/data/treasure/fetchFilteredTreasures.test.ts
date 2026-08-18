import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";
import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { treasure: { findMany } },
}));

// Same shape `buildEntitySchema.test.ts` uses to prove `buildResultSchema`
// accepts a real row: every field at its declared default, plus an id.
const validRow: Record<string, unknown> = { id: 1 };
for (const key of entityFieldKeys(PageType.Treasure)) {
  validRow[key] = fieldMeta[key]?.defaultValue;
}

describe("fetchFilteredTreasures (SPEC-013 T4b)", () => {
  it("returns rows for a well-formed result set", async () => {
    findMany.mockResolvedValue([validRow]);

    const { fetchFilteredTreasures } = await import("./fetchFilteredTreasures");
    const result = await fetchFilteredTreasures(Promise.resolve({}));

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("falls back to the declared default for a null value column", async () => {
    findMany.mockResolvedValue([{ ...validRow, value: null }]);

    const { fetchFilteredTreasures } = await import("./fetchFilteredTreasures");
    const result = await fetchFilteredTreasures(Promise.resolve({}));

    expect(result[0]?.value).toBe(fieldMeta.value?.defaultValue);
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...validRow, id: "not-a-number" }]);

    const { fetchFilteredTreasures } = await import("./fetchFilteredTreasures");

    await expect(fetchFilteredTreasures(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { fetchFilteredTreasures } = await import("./fetchFilteredTreasures");

    await expect(fetchFilteredTreasures(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });
});
