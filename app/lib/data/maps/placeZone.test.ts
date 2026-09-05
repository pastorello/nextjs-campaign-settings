import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateMany, findUnique, findMany } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { updateMany, findUnique, findMany } },
}));

// T5's structural rule has its own tests; here it is a collaborator, and
// what matters is that it is asked first and that its refusal is honoured.
const { checkTreePlacement } = vi.hoisted(() => ({
  checkTreePlacement: vi.fn(),
}));
vi.mock("./checkTreePlacement", () => ({ default: checkTreePlacement }));

import placeZone from "./placeZone";

/**
 * The `intent: "place"` half of `updateZonePosition`, moved here whole by
 * SPEC-017 T3. The assertions are the ones TD-93 shipped — this is a
 * refactor, so a change in what they check would mean the extraction was
 * not one.
 */
describe("placeZone (SPEC-017 T3, extracted from updateZonePosition)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue({ parentId: 1 });
    findMany.mockResolvedValue([]);
    checkTreePlacement.mockResolvedValue(null);
  });

  it("places an unpositioned place through a guarded write (TD-93)", async () => {
    const result = await placeZone({ id: 5, parentId: 1, lat: 20, lng: 20 });

    expect(result).toEqual({ ok: true });
    // The pre-state is in the `where`, not in an earlier read: that is
    // what makes the database the thing refusing a second placement.
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 5, lat: null },
      data: { lat: 20, lng: 20, parentId: 1 },
    });
  });

  it("writes the tree edge in the same statement as the coordinates (SPEC-017 T4)", async () => {
    // The place currently lives under 1; it is being placed on 9's map.
    findUnique.mockResolvedValue({ parentId: 1 });

    const result = await placeZone({ id: 5, parentId: 9, lat: 20, lng: 20 });

    expect(result).toEqual({ ok: true });
    // One write, not two: a coordinate means nothing except against the
    // map it was measured on (ADR-0012), so the edge cannot lag behind it.
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 5, lat: null },
      data: { lat: 20, lng: 20, parentId: 9 },
    });
  });

  it("checks the point against the target's siblings, not the ones it is leaving", async () => {
    findUnique.mockResolvedValue({ parentId: 1 });

    await placeZone({ id: 5, parentId: 9, lat: 20, lng: 20 });

    expect(findMany).toHaveBeenCalledWith({
      where: { parentId: 9, id: { not: 5 } },
      select: { title: true, footprint: true },
    });
  });

  it("refuses to place the root, which has no parent to leave", async () => {
    findUnique.mockResolvedValue({ parentId: null });

    const result = await placeZone({ id: 1, parentId: 9, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["The root place cannot be placed on a map."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses placing a place that already has coordinates (TD-93)", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await placeZone({ id: 5, parentId: 1, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      code: "alreadyPlaced",
      errors: {
        lat: [
          "This place is already positioned. Move it back to the unpositioned places first.",
        ],
      },
    });
  });

  it("says a missing row is missing rather than already placed", async () => {
    findUnique.mockResolvedValue(null);

    const result = await placeZone({ id: 404, parentId: 1, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["This place does not exist."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses a placement that would put a place inside its own subtree (T5)", async () => {
    checkTreePlacement.mockResolvedValue({
      parentId: ["A place cannot be placed inside a place that it contains."],
    });

    const result = await placeZone({ id: 5, parentId: 9, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      code: "wouldCycle",
      errors: {
        parentId: ["A place cannot be placed inside a place that it contains."],
      },
    });
    expect(updateMany).not.toHaveBeenCalled();
    expect(checkTreePlacement).toHaveBeenCalledWith({
      zoneId: 5,
      targetParentId: 9,
    });
  });

  it("asks the structural question before the spatial one", async () => {
    checkTreePlacement.mockResolvedValue({ parentId: ["nope"] });

    await placeZone({ id: 5, parentId: 9, lat: 20, lng: 20 });

    // "Which siblings would it collide with" means nothing when the target
    // is inside the subtree being moved.
    expect(findMany).not.toHaveBeenCalled();
  });

  it("refuses a placement inside an existing sibling area (SPEC-009 §7)", async () => {
    findMany.mockResolvedValue([
      {
        title: "Kang",
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
    ]);

    const result = await placeZone({ id: 5, parentId: 1, lat: 20, lng: 20 });

    expect(result).toEqual({
      ok: false,
      errors: { lat: ["This point is inside an existing area: Kang."] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("excludes its own row from the sibling query", async () => {
    // Matters most when the target is also the current parent — the
    // ordinary case, and every case until T8 widens the pool.
    await placeZone({ id: 5, parentId: 1, lat: 20, lng: 20 });

    expect(findMany).toHaveBeenCalledWith({
      where: { parentId: 1, id: { not: 5 } },
      select: { title: true, footprint: true },
    });
  });

  it("rejects invalid input with field-level errors", async () => {
    const result = await placeZone({
      id: 5,
      parentId: 1,
      lat: Number.NaN,
      lng: 20,
    });

    expect(result.ok).toBe(false);
    // Narrowed rather than matched loosely: `MutationResult`'s failure arm
    // is what a form reads, so the test should fail if the key moves.
    if (!result.ok) expect(Object.keys(result.errors)).toContain("lat");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError without a session, and writes nothing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      placeZone({ id: 5, parentId: 1, lat: 20, lng: 20 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
