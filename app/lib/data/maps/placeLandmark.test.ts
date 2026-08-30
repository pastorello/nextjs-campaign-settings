import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findUnique, updateMany, zoneFindMany, poiFindMany } = vi.hoisted(
  () => ({
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    zoneFindMany: vi.fn(),
    poiFindMany: vi.fn(),
  })
);
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    poi: { findUnique, updateMany, findMany: poiFindMany },
    zone: { findMany: zoneFindMany },
  },
}));

import placeLandmark from "./placeLandmark";

describe("placeLandmark (TD-102)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ zoneId: 3 });
    zoneFindMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([]);
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("writes the position to `poi`, never to `zone`", async () => {
    const result = await placeLandmark({ id: 5, lat: 10, lng: 20 });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      // `lat: null` in the `where`, not a read-then-write: this is TD-93's
      // guard, and it is the reason a stale dropdown cannot place a
      // landmark twice.
      where: { id: 5, lat: null },
      data: { lat: 10, lng: 20 },
    });
  });

  it("refuses a landmark that already has coordinates, with the code the caller renders from", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await placeLandmark({ id: 5, lat: 10, lng: 20 });

    expect(result).toEqual({
      ok: false,
      code: "alreadyPlaced",
      errors: { lat: ["This landmark is already positioned."] },
    });
  });

  it("refuses an id no landmark has, rather than writing blind", async () => {
    // The whole point of TD-102: an id alone does not say which table it
    // belongs to, and `zone`/`poi` ids collide freely. A miss here means
    // the caller sent a zone id, and inventing a row for it is exactly the
    // failure being closed.
    findUnique.mockResolvedValue(null);

    const result = await placeLandmark({ id: 5, lat: 10, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["This landmark does not exist."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses a point inside a sibling area (SPEC-009 §7)", async () => {
    zoneFindMany.mockResolvedValue([
      {
        title: "Kang",
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
    ]);

    const result = await placeLandmark({ id: 5, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { lat: ["This point is inside an existing area: Kang."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("rejects a non-finite coordinate before touching the database", async () => {
    const result = await placeLandmark({ id: 5, lat: Number.NaN, lng: 20 });

    expect(result.ok).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(placeLandmark({ id: 5, lat: 10, lng: 20 })).rejects.toThrow(
      UnauthorizedError
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
});
