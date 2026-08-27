import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, updateMany, entityFindUnique, poiFindUnique, zoneFindUnique } =
  vi.hoisted(() => ({
    update: vi.fn(),
    updateMany: vi.fn(),
    entityFindUnique: vi.fn(),
    poiFindUnique: vi.fn(),
    zoneFindUnique: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    deities: { update, updateMany, findUnique: entityFindUnique },
    poi: { findUnique: poiFindUnique },
    zone: { findUnique: zoneFindUnique },
  },
}));

import assignDeityLocation from "./assignLocation";

describe("assignDeityLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      assignDeityLocation({ id: 1, zoneId: null, poiId: null })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects invalid input without writing", async () => {
    const result = await assignDeityLocation({
      id: 1,
      zoneId: null,
      poiId: 9,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("clears both fields back to Sconosciuta", async () => {
    update.mockResolvedValue({});

    const result = await assignDeityLocation({
      id: 1,
      zoneId: null,
      poiId: null,
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { zoneId: null, poiId: null },
    });
    // Never guarded (TD-93): clearing is the removal the refusal asks for.
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("setting a poi sets zoneId to that poi's own zone", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });

    const result = await assignDeityLocation({ id: 1, zoneId: 5, poiId: 9 });

    expect(result).toEqual({ ok: true });
    // The pre-state travels in the `where` (TD-93): the database is what
    // refuses a second attachment, not a read taken just before the write.
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 1, zoneId: null, poiId: null },
      data: { zoneId: 5, poiId: 9 },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a poi from a different zone without writing", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });

    const result = await assignDeityLocation({ id: 1, zoneId: 6, poiId: 9 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("wraps a write failure in a DatabaseError", async () => {
    zoneFindUnique.mockResolvedValue({ id: 5 });
    updateMany.mockRejectedValue(new Error("constraint violation"));

    await expect(
      assignDeityLocation({ id: 1, zoneId: 5, poiId: null })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
  it("refuses attaching something that already has a location (TD-93)", async () => {
    zoneFindUnique.mockResolvedValue({ id: 5 });
    updateMany.mockResolvedValue({ count: 0 });
    entityFindUnique.mockResolvedValue({ id: 1 });

    const result = await assignDeityLocation({ id: 1, zoneId: 5, poiId: null });

    expect(result).toEqual({
      ok: false,
      code: "alreadyPlaced",
      errors: {
        zoneId: [
          "This deity is already at a location. Remove it from there first.",
        ],
      },
    });
  });

  it("says a missing row is missing rather than already placed", async () => {
    zoneFindUnique.mockResolvedValue({ id: 5 });
    updateMany.mockResolvedValue({ count: 0 });
    entityFindUnique.mockResolvedValue(null);

    const result = await assignDeityLocation({
      id: 404,
      zoneId: 5,
      poiId: null,
    });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["This deity does not exist."] },
    });
  });
});
