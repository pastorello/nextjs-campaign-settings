import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { zoneFindUnique, zoneCreate, poiCreate } = vi.hoisted(() => ({
  zoneFindUnique: vi.fn(),
  zoneCreate: vi.fn(),
  poiCreate: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findUnique: zoneFindUnique, create: zoneCreate },
    poi: { create: poiCreate },
  },
}));

import createPlaceFromPicker from "./createPlaceFromPicker";

describe("createPlaceFromPicker (SPEC-026)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    zoneFindUnique.mockResolvedValue({ id: 5 });
    zoneCreate.mockResolvedValue({ id: 40 });
    poiCreate.mockResolvedValue({ id: 90 });
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      createPlaceFromPicker({ title: "Taverna", parentId: 5, kind: "poi" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(poiCreate).not.toHaveBeenCalled();
  });

  it("creates a landmark with no position under the parent (the dialog's default)", async () => {
    const result = await createPlaceFromPicker({
      title: "Taverna del Gallo Robin",
      parentId: 5,
      kind: "poi",
    });

    expect(result).toEqual({
      ok: true,
      place: { kind: "poi", id: 90, parentId: 5 },
    });
    expect(poiCreate).toHaveBeenCalledWith({
      data: {
        title: "Taverna del Gallo Robin",
        zoneId: 5,
        category: "food-drink",
        lat: null,
        lng: null,
      },
    });
    expect(zoneCreate).not.toHaveBeenCalled();
  });

  it("creates a navigable place with no position, no map and the kind chosen", async () => {
    const result = await createPlaceFromPicker({
      title: "Skreebars",
      parentId: 5,
      kind: "city",
    });

    expect(result).toEqual({
      ok: true,
      place: { kind: "zone", id: 40, parentId: 5 },
    });
    expect(zoneCreate).toHaveBeenCalledWith({
      data: {
        title: "Skreebars",
        kind: "city",
        parentId: 5,
        lat: null,
        lng: null,
      },
    });
    expect(poiCreate).not.toHaveBeenCalled();
  });

  it("refuses an empty name with a field error, writing nothing", async () => {
    const result = await createPlaceFromPicker({
      title: "",
      parentId: 5,
      kind: "poi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeDefined();
    expect(poiCreate).not.toHaveBeenCalled();
  });

  it("refuses a missing parent — never silently the root (§5)", async () => {
    const result = await createPlaceFromPicker({
      title: "Taverna",
      parentId: null,
      kind: "poi",
    });

    expect(result).toEqual({
      ok: false,
      errors: { parentId: [{ key: "placeNeedsParent" }] },
    });
    expect(poiCreate).not.toHaveBeenCalled();
  });

  it("refuses a parent that does not exist", async () => {
    zoneFindUnique.mockResolvedValue(null);

    const result = await createPlaceFromPicker({
      title: "Taverna",
      parentId: 999,
      kind: "poi",
    });

    expect(result).toEqual({
      ok: false,
      errors: { parentId: [{ key: "placeNotFound" }] },
    });
    expect(poiCreate).not.toHaveBeenCalled();
  });

  it("refuses a kind that is not a place", async () => {
    const result = await createPlaceFromPicker({
      title: "Taverna",
      parentId: 5,
      kind: "npc" as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.kind).toBeDefined();
  });

  it("wraps a database failure in a DatabaseError", async () => {
    poiCreate.mockRejectedValue(new Error("connection lost"));

    await expect(
      createPlaceFromPicker({ title: "Taverna", parentId: 5, kind: "poi" })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
