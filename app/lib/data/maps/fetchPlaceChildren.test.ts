import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

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

import fetchPlaceChildren from "./fetchPlaceChildren";

function zoneRow(overrides: Partial<Record<string, unknown>>) {
  return {
    id: 1,
    title: "Somewhere",
    description: null,
    kind: "region",
    parentId: 1,
    lat: null,
    lng: null,
    mapImage: null,
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function poiRow(overrides: Partial<Record<string, unknown>>) {
  return {
    id: 1,
    title: "Somewhere",
    description: null,
    lat: 10,
    lng: 20,
    category: "religion",
    zoneId: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("fetchPlaceChildren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    zoneFindMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([]);
  });

  it("queries zones by parentId and landmarks by zoneId, both scoped to the given place", async () => {
    await fetchPlaceChildren(42);

    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { parentId: 42 },
      orderBy: { createdAt: "asc" },
    });
    expect(poiFindMany).toHaveBeenCalledWith({
      where: { zoneId: 42 },
      orderBy: { createdAt: "asc" },
    });
  });

  it("merges navigable and landmark children into one list", async () => {
    zoneFindMany.mockResolvedValue([
      zoneRow({ id: 5, title: "Kingdom of Kang", kind: "region" }),
    ]);
    poiFindMany.mockResolvedValue([poiRow({ id: 9, title: "Kang Market" })]);

    const children = await fetchPlaceChildren(1);

    expect(children.map((c) => c.title)).toEqual([
      "Kingdom of Kang",
      "Kang Market",
    ]);
  });

  it("exposes a zone child's kind, map fields, and null category", async () => {
    zoneFindMany.mockResolvedValue([
      zoneRow({
        id: 5,
        title: "Kingdom of Kang",
        kind: "region",
        mapImage: "kang.png",
        mapBounds: [
          [0, 0],
          [500, 500],
        ],
        mapInitialView: [250, 250],
        mapInitialZoom: 2,
      }),
    ]);

    const [child] = await fetchPlaceChildren(1);

    expect(child).toMatchObject({
      kind: "region",
      mapImage: "kang.png",
      category: null,
      mapBounds: [
        [0, 0],
        [500, 500],
      ],
      mapInitialView: [250, 250],
      mapInitialZoom: 2,
    });
  });

  it("exposes a landmark child's category, position, and null map fields", async () => {
    poiFindMany.mockResolvedValue([
      poiRow({ id: 9, title: "Kang Market", category: "shopping" }),
    ]);

    const [child] = await fetchPlaceChildren(1);

    expect(child).toMatchObject({
      kind: "poi",
      category: "shopping",
      lat: 10,
      lng: 20,
      mapImage: null,
      mapBounds: null,
    });
  });

  it("throws UnauthorizedError without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchPlaceChildren(1)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(zoneFindMany).not.toHaveBeenCalled();
    expect(poiFindMany).not.toHaveBeenCalled();
  });
});
