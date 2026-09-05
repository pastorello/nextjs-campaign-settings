import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  findUnique,
  updateMany,
  zoneFindMany,
  poiFindMany,
  npcUpdateMany,
  deitiesUpdateMany,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  zoneFindMany: vi.fn(),
  poiFindMany: vi.fn(),
  npcUpdateMany: vi.fn(),
  deitiesUpdateMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => {
  const client = {
    poi: { findUnique, updateMany, findMany: poiFindMany },
    zone: { findMany: zoneFindMany },
    npc: { updateMany: npcUpdateMany },
    deities: { updateMany: deitiesUpdateMany },
    // The interactive form (SPEC-017 T6): hands the callback the same
    // client and lets a throw propagate, which is how the refusal aborts
    // the follow-through. The rollback itself is Postgres's job and no unit
    // test can prove it — what these can prove is that the writes which
    // must not happen are never issued.
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };
  return { default: client };
});

import placeLandmark from "./placeLandmark";

describe("placeLandmark (TD-102)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ zoneId: 3 });
    zoneFindMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([]);
    updateMany.mockResolvedValue({ count: 1 });
    npcUpdateMany.mockResolvedValue({ count: 0 });
    deitiesUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("writes the position to `poi`, never to `zone`", async () => {
    const result = await placeLandmark({ id: 5, zoneId: 3, lat: 10, lng: 20 });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      // `lat: null` in the `where`, not a read-then-write: this is TD-93's
      // guard, and it is the reason a stale dropdown cannot place a
      // landmark twice.
      where: { id: 5, lat: null },
      data: { lat: 10, lng: 20, zoneId: 3 },
    });
  });

  it("moves the landmark's zone and every entity at it together (SPEC-017 T6)", async () => {
    // It currently belongs to 3; it is being placed on 9's map.
    findUnique.mockResolvedValue({ zoneId: 3 });

    const result = await placeLandmark({ id: 5, zoneId: 9, lat: 10, lng: 20 });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 5, lat: null },
      data: { lat: 10, lng: 20, zoneId: 9 },
    });
    // ADR-0010: an entity with a `poiId` carries that landmark's zone, so
    // the landmark changing zones has to drag them along. `poiId` itself
    // is untouched — they are still at the same landmark.
    expect(npcUpdateMany).toHaveBeenCalledWith({
      where: { poiId: 5 },
      data: { zoneId: 9 },
    });
    expect(deitiesUpdateMany).toHaveBeenCalledWith({
      where: { poiId: 5 },
      data: { zoneId: 9 },
    });
  });

  it("checks the point against the target's siblings, not the ones it is leaving", async () => {
    findUnique.mockResolvedValue({ zoneId: 3 });

    await placeLandmark({ id: 5, zoneId: 9, lat: 10, lng: 20 });

    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { parentId: 9 },
      select: { title: true, footprint: true },
    });
  });

  it("leaves the entities alone when the placement is refused", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await placeLandmark({ id: 5, zoneId: 9, lat: 10, lng: 20 });

    // The guard is inside the transaction, so a refusal aborts before the
    // follow-through: an entity must never end up pointing at a zone its
    // landmark was not moved to.
    expect(result).toEqual({
      ok: false,
      code: "alreadyPlaced",
      errors: { lat: ["This landmark is already positioned."] },
    });
    expect(npcUpdateMany).not.toHaveBeenCalled();
    expect(deitiesUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a landmark that already has coordinates, with the code the caller renders from", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await placeLandmark({ id: 5, zoneId: 3, lat: 10, lng: 20 });

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

    const result = await placeLandmark({ id: 5, zoneId: 3, lat: 10, lng: 20 });

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

    const result = await placeLandmark({ id: 5, zoneId: 3, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { lat: ["This point is inside an existing area: Kang."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("rejects a non-finite coordinate before touching the database", async () => {
    const result = await placeLandmark({
      id: 5,
      zoneId: 3,
      lat: Number.NaN,
      lng: 20,
    });

    expect(result.ok).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      placeLandmark({ id: 5, zoneId: 3, lat: 10, lng: 20 })
    ).rejects.toThrow(UnauthorizedError);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
