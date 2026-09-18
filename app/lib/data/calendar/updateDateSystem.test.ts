import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import { humanCountInputFixture } from "@/app/lib/calendar/dateSystemFixtures";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateMany, findUnique } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { updateMany, findUnique } },
}));

import updateDateSystem from "./updateDateSystem";

const payload = { ...humanCountInputFixture, id: 2 };

describe("updateDateSystem (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateDateSystem(payload)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("re-anchors one of the DM's systems, never the universal count", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    const result = await updateDateSystem({ ...payload, anchorYear: 6000 });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 2, isUniversal: false },
      data: { ...humanCountInputFixture, anchorYear: 6000 },
    });
  });

  it("refuses the universal count, keyed on id", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ isUniversal: true });

    const result = await updateDateSystem({ ...payload, id: 1 });

    expect(result).toEqual({
      ok: false,
      errors: { id: [{ key: "universalDateSystemFixed" }] },
    });
  });

  it("refuses a system that does not exist", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue(null);

    const result = await updateDateSystem({ ...payload, id: 99 });

    expect(result).toEqual({
      ok: false,
      errors: { id: [{ key: "dateSystemNotFound" }] },
    });
  });

  it("refuses thirteen month names without writing", async () => {
    const result = await updateDateSystem({
      ...payload,
      monthNames: [...payload.monthNames, "Tredicesimo"],
    });

    expect(result).toEqual({
      ok: false,
      errors: { monthNames: [{ key: "monthNamesCount" }] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses a partial payload rather than writing half a system", async () => {
    const partial: Partial<typeof payload> = { ...payload };
    delete partial.weekdayNames;

    const result = await updateDateSystem(partial as typeof payload);

    expect(result.ok).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
