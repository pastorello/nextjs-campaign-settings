import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { poiFindMany, npcFindMany, deitiesFindMany } = vi.hoisted(() => ({
  poiFindMany: vi.fn(),
  npcFindMany: vi.fn(),
  deitiesFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    poi: { findMany: poiFindMany },
    npc: { findMany: npcFindMany },
    deities: { findMany: deitiesFindMany },
  },
}));

import fetchPlaceChildren from "./fetchPlaceChildren";

function row(overrides: Partial<Record<string, unknown>>) {
  return {
    id: 1,
    title: "Somewhere",
    description: null,
    kind: "poi",
    lat: 10,
    lng: 20,
    category: "religion",
    linkedType: null,
    linkedId: null,
    mapImage: null,
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("fetchPlaceChildren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    npcFindMany.mockResolvedValue([]);
    deitiesFindMany.mockResolvedValue([]);
  });

  it("returns only the pins under two different parents, isolated from each other", async () => {
    // Simulates a real filtered query: this "database" holds children of
    // two different parents, and the mock only returns the rows matching
    // whatever `where.parentId` the function actually queried with — the
    // same thing that would isolate them for real (SPEC-004 §1's defect).
    const database = [
      { ...row({ id: 1, title: "Skreebars Tavern" }), parentId: 100 },
      { ...row({ id: 2, title: "Skreebars Temple" }), parentId: 100 },
      { ...row({ id: 3, title: "Kang Market" }), parentId: 200 },
    ];
    poiFindMany.mockImplementation(
      ({ where }: { where: { parentId: number } }) =>
        Promise.resolve(database.filter((r) => r.parentId === where.parentId))
    );

    const skreebarsChildren = await fetchPlaceChildren(100);
    const kangChildren = await fetchPlaceChildren(200);

    expect(skreebarsChildren.map((c) => c.title)).toEqual([
      "Skreebars Tavern",
      "Skreebars Temple",
    ]);
    expect(kangChildren.map((c) => c.title)).toEqual(["Kang Market"]);
  });

  it("queries by the given parentId", async () => {
    poiFindMany.mockResolvedValue([]);

    await fetchPlaceChildren(42);

    expect(poiFindMany).toHaveBeenCalledWith({
      where: { parentId: 42 },
      orderBy: { createdAt: "asc" },
    });
  });

  it("exposes kind and mapImage, unlike fetchPois", async () => {
    poiFindMany.mockResolvedValue([
      row({
        id: 5,
        title: "Kingdom of Kang",
        kind: "region",
        lat: null,
        lng: null,
        category: null,
        mapImage: "kang.png",
      }),
    ]);

    const [child] = await fetchPlaceChildren(1);

    expect(child).toMatchObject({
      kind: "region",
      mapImage: "kang.png",
      lat: null,
      lng: null,
      category: null,
    });
  });

  it("exposes a region child's stored map view (SPEC-004 M7)", async () => {
    poiFindMany.mockResolvedValue([
      row({
        id: 5,
        kind: "region",
        lat: 5,
        lng: 5,
        category: null,
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

    expect(child?.mapBounds).toEqual([
      [0, 0],
      [500, 500],
    ]);
    expect(child?.mapInitialView).toEqual([250, 250]);
    expect(child?.mapInitialZoom).toBe(2);
  });

  it("degrades a link whose target was deleted to unlinked", async () => {
    poiFindMany.mockResolvedValue([
      row({ kind: "npc", linkedType: "npc", linkedId: 99 }),
    ]);
    npcFindMany.mockResolvedValue([]); // target gone

    const [child] = await fetchPlaceChildren(1);

    expect(child?.linkedType).toBeNull();
    expect(child?.linkedId).toBeNull();
  });

  it("throws UnauthorizedError without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchPlaceChildren(1)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(poiFindMany).not.toHaveBeenCalled();
  });
});
