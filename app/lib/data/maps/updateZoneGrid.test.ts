import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import { GRID_COLUMNS_MAX } from "@/app/lib/config/geography/zoneGridMeta";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { update } },
}));

import updateZoneGrid from "./updateZoneGrid";

describe("updateZoneGrid (SPEC-015 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      updateZoneGrid({ id: 1, gridColumns: 36, gridScale: GridScale.Kingdom })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes the grid onto an existing zone", async () => {
    const result = await updateZoneGrid({
      id: 7,
      gridColumns: 36,
      gridScale: GridScale.Kingdom,
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { gridColumns: 36, gridScale: GridScale.Kingdom },
    });
  });

  it("rejects a zero width with a field-level error, without writing", async () => {
    const result = await updateZoneGrid({
      id: 7,
      gridColumns: 0,
      gridScale: GridScale.Kingdom,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toHaveProperty("gridColumns");
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a negative width, without writing", async () => {
    const result = await updateZoneGrid({
      id: 7,
      gridColumns: -5,
      gridScale: GridScale.Kingdom,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a width past the cap, without writing", async () => {
    const result = await updateZoneGrid({
      id: 7,
      gridColumns: GRID_COLUMNS_MAX + 1,
      gridScale: GridScale.Kingdom,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toHaveProperty("gridColumns");
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a scale outside the four, without writing", async () => {
    const result = await updateZoneGrid({
      id: 7,
      gridColumns: 36,
      gridScale: "hex" as GridScale,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toHaveProperty("gridScale");
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateZoneGrid({
      id: -1,
      gridColumns: 36,
      gridScale: GridScale.Kingdom,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
