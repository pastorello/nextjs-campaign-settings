import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { zoneFindMany } = vi.hoisted(() => ({ zoneFindMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany: zoneFindMany } },
}));

import buildLocationWhere from "./buildLocationWhere";

describe("buildLocationWhere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("leaves the where clause untouched when neither param is present", async () => {
    const result = await buildLocationWhere({ name: "foo" }, {});

    expect(result).toEqual({ name: "foo" });
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it("filters to zoneId IS NULL for the Sconosciuta sentinel", async () => {
    const result = await buildLocationWhere({}, { zoneId: "none" });

    expect(result).toEqual({ zoneId: null });
  });

  it("resolves a zoneId to its descendant-inclusive IN list", async () => {
    zoneFindMany.mockResolvedValue([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
    ]);

    const result = await buildLocationWhere({}, { zoneId: "1" });

    expect(result).toEqual({ zoneId: { in: [1, 2] } });
  });

  it("ignores a non-numeric zoneId", async () => {
    const result = await buildLocationWhere({ name: "foo" }, { zoneId: "abc" });

    expect(result).toEqual({ name: "foo" });
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it("layers a poiId filter on top of the zone filter", async () => {
    zoneFindMany.mockResolvedValue([{ id: 1, parentId: null }]);

    const result = await buildLocationWhere({}, { zoneId: "1", poiId: "9" });

    expect(result).toEqual({ zoneId: { in: [1] }, poiId: 9 });
  });

  it("applies a poiId filter with no zoneId present", async () => {
    const result = await buildLocationWhere({}, { poiId: "9" });

    expect(result).toEqual({ poiId: 9 });
  });
});
