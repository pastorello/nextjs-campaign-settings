import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteMany, findUnique } = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { deleteMany, findUnique } },
}));

import deleteDateSystemById from "./deleteDateSystemById";

describe("deleteDateSystemById (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without deleting", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deleteDateSystemById(2)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("deletes a system that is neither universal nor the default, guarded in the write", async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteDateSystemById(2);

    expect(result).toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: 2, isUniversal: false, isDefault: false },
    });
  });

  it("refuses the universal count", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ isUniversal: true, isDefault: false });

    expect(await deleteDateSystemById(1)).toEqual({
      ok: false,
      errors: { id: [{ key: "universalDateSystemUndeletable" }] },
    });
  });

  it("refuses the universal count while it is also the default, as the universal count", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ isUniversal: true, isDefault: true });

    expect(await deleteDateSystemById(1)).toEqual({
      ok: false,
      errors: { id: [{ key: "universalDateSystemUndeletable" }] },
    });
  });

  it("refuses the current default", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ isUniversal: false, isDefault: true });

    expect(await deleteDateSystemById(2)).toEqual({
      ok: false,
      errors: { id: [{ key: "defaultDateSystemUndeletable" }] },
    });
  });

  it("refuses a system that does not exist", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue(null);

    expect(await deleteDateSystemById(99)).toEqual({
      ok: false,
      errors: { id: [{ key: "dateSystemNotFound" }] },
    });
  });

  it("refuses a malformed id without touching the database", async () => {
    expect(await deleteDateSystemById(-1)).toEqual({
      ok: false,
      errors: { id: [{ key: "invalidType" }] },
    });
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
