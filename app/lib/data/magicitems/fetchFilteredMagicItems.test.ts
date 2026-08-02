import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";
import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { magicitems: { findMany } },
}));

// Same shape `buildEntitySchema.test.ts` uses to prove `buildResultSchema`
// accepts a real row: every field at its declared default, plus an id.
const validRow: Record<string, unknown> = { id: 1 };
for (const key of entityFieldKeys(PageType.MagicItem)) {
  validRow[key] = fieldMeta[key]?.defaultValue;
}

describe("fetchFilteredMagicItems (TD-38)", () => {
  it("returns rows for a well-formed result set", async () => {
    findMany.mockResolvedValue([validRow]);

    const { fetchFilteredMagicItems } =
      await import("./fetchFilteredMagicItems");
    const result = await fetchFilteredMagicItems(Promise.resolve({}));

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("falls back to the declared default for a null attuned column (TD-02b)", async () => {
    findMany.mockResolvedValue([{ ...validRow, attuned: null }]);

    const { fetchFilteredMagicItems } =
      await import("./fetchFilteredMagicItems");
    const result = await fetchFilteredMagicItems(Promise.resolve({}));

    expect(result[0]?.attuned).toBe(fieldMeta.attuned?.defaultValue);
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...validRow, id: "not-a-number" }]);

    const { fetchFilteredMagicItems } =
      await import("./fetchFilteredMagicItems");

    await expect(fetchFilteredMagicItems(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { fetchFilteredMagicItems } =
      await import("./fetchFilteredMagicItems");

    await expect(fetchFilteredMagicItems(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });
});
