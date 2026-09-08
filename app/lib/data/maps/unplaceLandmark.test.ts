import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateMany, npcUpdateMany, deitiesUpdateMany } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  npcUpdateMany: vi.fn(),
  deitiesUpdateMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    poi: { updateMany },
    npc: { updateMany: npcUpdateMany },
    deities: { updateMany: deitiesUpdateMany },
  },
}));

import unplaceLandmark from "./unplaceLandmark";

describe("unplaceLandmark (SPEC-017 T10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("clears the position and nothing else", async () => {
    const result = await unplaceLandmark({ id: 5 });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { lat: null, lng: null },
    });
  });

  it("keeps the landmark's zone, which is where it still belongs", async () => {
    await unplaceLandmark({ id: 5 });

    // ADR-0012 clause 2: an unplaced row keeps its edge as provenance, and
    // `poi.zoneId` is NOT NULL besides. The pool's "da «X»" label is the
    // one place that value is read before a placement overwrites it.
    const call = updateMany.mock.calls[0]?.[0] as { data: object };
    expect(call.data).not.toHaveProperty("zoneId");
  });

  it("touches no entity, unlike placing one", async () => {
    await unplaceLandmark({ id: 5 });

    // ADR-0010 says an entity with a `poiId` carries that landmark's zone.
    // Un-placing does not change the zone, so there is nothing to follow.
    expect(npcUpdateMany).not.toHaveBeenCalled();
    expect(deitiesUpdateMany).not.toHaveBeenCalled();
  });

  it("says a missing landmark is missing rather than reporting success", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await unplaceLandmark({ id: 404 });

    expect(result).toEqual({
      ok: false,
      errors: { id: ["This landmark does not exist."] },
    });
  });

  it("rejects invalid input with field-level errors", async () => {
    const result = await unplaceLandmark({ id: -1 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toContain("id");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(unplaceLandmark({ id: 5 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("wraps a database failure", async () => {
    updateMany.mockRejectedValue(new Error("connection reset"));

    await expect(unplaceLandmark({ id: 5 })).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
