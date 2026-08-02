import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";
import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { findMany } },
}));

// Same shape `buildEntitySchema.test.ts` uses to prove `buildResultSchema`
// accepts a real row: every field at its declared default, plus an id.
const validRow: Record<string, unknown> = { id: 1 };
for (const key of entityFieldKeys(PageType.Deity)) {
  validRow[key] = fieldMeta[key]?.defaultValue;
}

describe("fetchFilteredDeities (TD-38)", () => {
  it("returns rows for a well-formed result set", async () => {
    findMany.mockResolvedValue([validRow]);

    const { fetchFilteredDeities } = await import("./fetchFilteredDeities");
    const result = await fetchFilteredDeities(Promise.resolve({}));

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...validRow, id: "not-a-number" }]);

    const { fetchFilteredDeities } = await import("./fetchFilteredDeities");

    await expect(fetchFilteredDeities(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { fetchFilteredDeities } = await import("./fetchFilteredDeities");

    await expect(fetchFilteredDeities(Promise.resolve({}))).rejects.toThrow(
      DatabaseError
    );
  });
});
