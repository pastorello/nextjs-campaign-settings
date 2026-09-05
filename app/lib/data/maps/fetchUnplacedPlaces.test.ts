import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { zoneFindMany, poiFindMany } = vi.hoisted(() => ({
  zoneFindMany: vi.fn(),
  poiFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findMany: zoneFindMany },
    poi: { findMany: poiFindMany },
  },
}));

import fetchUnplacedPlaces from "./fetchUnplacedPlaces";

function zoneRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 7,
    title: "Skreebars",
    kind: "city",
    parentId: 2,
    parent: { title: "Regno di Kang" },
    ...overrides,
  };
}

function poiRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 7,
    title: "Taverna del Gallo Robin",
    zoneId: 3,
    zone: { title: "Skreebars" },
    ...overrides,
  };
}

describe("fetchUnplacedPlaces (SPEC-017 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    zoneFindMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the whole campaign, not the children of one map", async () => {
    await fetchUnplacedPlaces();

    expect(zoneFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { lat: null, parentId: { not: null } },
      })
    );
    expect(poiFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lat: null } })
    );
  });

  it("merges unplaced zones and unplaced landmarks into one list", async () => {
    zoneFindMany.mockResolvedValue([zoneRow({ id: 1, title: "Abbazia" })]);
    poiFindMany.mockResolvedValue([poiRow({ id: 1, title: "Ponte" })]);

    const pool = await fetchUnplacedPlaces();

    expect(pool.map((place) => place.title)).toEqual(["Abbazia", "Ponte"]);
  });

  it("labels a landmark 'poi' and a zone with its own kind — TD-102's discriminator", async () => {
    zoneFindMany.mockResolvedValue([zoneRow({ kind: "dungeon" })]);
    poiFindMany.mockResolvedValue([poiRow()]);

    const pool = await fetchUnplacedPlaces();

    expect(pool.map((place) => place.kind).sort()).toEqual(["dungeon", "poi"]);
  });

  it("carries provenance for both halves — where the place came from", async () => {
    zoneFindMany.mockResolvedValue([
      zoneRow({ id: 5, parentId: 2, parent: { title: "Regno di Kang" } }),
    ]);
    poiFindMany.mockResolvedValue([
      poiRow({ id: 9, zoneId: 3, zone: { title: "Skreebars" } }),
    ]);

    const pool = await fetchUnplacedPlaces();

    expect(pool).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
          parentId: 2,
          parentTitle: "Regno di Kang",
        }),
        expect.objectContaining({
          id: 9,
          parentId: 3,
          parentTitle: "Skreebars",
        }),
      ])
    );
  });

  it("sorts the merged list by title, across both tables", async () => {
    zoneFindMany.mockResolvedValue([
      zoneRow({ id: 1, title: "Zaffiro" }),
      zoneRow({ id: 2, title: "Abbazia" }),
    ]);
    poiFindMany.mockResolvedValue([
      poiRow({ id: 1, title: "Ponte" }),
      poiRow({ id: 2, title: "Àlbero" }),
    ]);

    const pool = await fetchUnplacedPlaces();

    expect(pool.map((place) => place.title)).toEqual([
      "Abbazia",
      "Àlbero",
      "Ponte",
      "Zaffiro",
    ]);
  });

  it("discards a zone whose kind nothing recognises", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    zoneFindMany.mockResolvedValue([
      zoneRow({ id: 4, kind: "continent" }),
      zoneRow({ id: 5, kind: "city" }),
    ]);

    const pool = await fetchUnplacedPlaces();

    expect(pool.map((place) => place.id)).toEqual([5]);
    expect(warn).toHaveBeenCalled();
  });

  it("discards a zone with no parent rather than asserting one", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    zoneFindMany.mockResolvedValue([
      zoneRow({ id: 4, parentId: null, parent: null }),
    ]);

    await expect(fetchUnplacedPlaces()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("wraps a query failure as a DatabaseError", async () => {
    zoneFindMany.mockRejectedValue(new Error("connection reset"));

    await expect(fetchUnplacedPlaces()).rejects.toBeInstanceOf(DatabaseError);
  });

  it("throws UnauthorizedError without a session, and reads nothing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchUnplacedPlaces()).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(zoneFindMany).not.toHaveBeenCalled();
    expect(poiFindMany).not.toHaveBeenCalled();
  });
});
