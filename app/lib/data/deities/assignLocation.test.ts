import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, poiFindUnique, zoneFindUnique } = vi.hoisted(() => ({
  update: vi.fn(),
  poiFindUnique: vi.fn(),
  zoneFindUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    deities: { update },
    poi: { findUnique: poiFindUnique },
    zone: { findUnique: zoneFindUnique },
  },
}));

import assignDeityLocation from "./assignLocation";

describe("assignDeityLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
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
  });

  it("setting a poi sets zoneId to that poi's own zone", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });
    update.mockResolvedValue({});

    const result = await assignDeityLocation({ id: 1, zoneId: 5, poiId: 9 });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { zoneId: 5, poiId: 9 },
    });
  });

  it("rejects a poi from a different zone without writing", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });

    const result = await assignDeityLocation({ id: 1, zoneId: 6, poiId: 9 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("wraps a write failure in a DatabaseError", async () => {
    zoneFindUnique.mockResolvedValue({ id: 5 });
    update.mockRejectedValue(new Error("constraint violation"));

    await expect(
      assignDeityLocation({ id: 1, zoneId: 5, poiId: null })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
