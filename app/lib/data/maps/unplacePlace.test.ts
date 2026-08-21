import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, findUnique } = vi.hoisted(() => ({
  update: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { update, findUnique },
  },
}));

import unplacePlace from "./unplacePlace";

describe("unplacePlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(unplacePlace({ id: 5 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects invalid input with field-level errors", async () => {
    const result = await unplacePlace({ id: -1 });

    expect(result.ok).toBe(false);
    expect((result as { errors: Record<string, string[]> }).errors.id).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to un-place the root", async () => {
    findUnique.mockResolvedValue({ parentId: null });

    const result = await unplacePlace({ id: 1 });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["The root place cannot be un-placed."] },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("clears lat, lng and footprint together for an ordinary place", async () => {
    findUnique.mockResolvedValue({ parentId: 1 });

    const result = await unplacePlace({ id: 5 });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { lat: null, lng: null, footprint: Prisma.JsonNull },
    });
  });

  it("clears the footprint of a place drawn as an area, along with its derived point", async () => {
    findUnique.mockResolvedValue({ parentId: 1 });

    await unplacePlace({ id: 7 });

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { lat: null, lng: null, footprint: Prisma.JsonNull },
    });
  });

  it("wraps a lookup failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    await expect(unplacePlace({ id: 5 })).rejects.toBeInstanceOf(DatabaseError);
  });

  it("wraps an update failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ parentId: 1 });
    update.mockRejectedValue(new Error("connection lost"));

    await expect(unplacePlace({ id: 5 })).rejects.toBeInstanceOf(DatabaseError);
  });
});
