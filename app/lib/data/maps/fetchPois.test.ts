import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.x.y)`.
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

import fetchPois from "./fetchPois";

const baseRow = {
  id: 1,
  title: "Shrine of Aerivel",
  description: null,
  lat: 10,
  lng: 20,
  category: "religion",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("fetchPois", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    npcFindMany.mockResolvedValue([]);
    deitiesFindMany.mockResolvedValue([]);
  });

  // Unlike the four `fetchFiltered*` readers, this one is a Server Action —
  // reachable from the browser, and therefore not covered by the proxy's
  // session gate. Without this guard it would serve the DM's whole world to
  // an unauthenticated POST.
  it("throws UnauthorizedError and never reads without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchPois()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(poiFindMany).not.toHaveBeenCalled();
  });

  it("returns a POI with no link untouched", async () => {
    poiFindMany.mockResolvedValue([
      { ...baseRow, linkedType: null, linkedId: null },
    ]);

    const result = await fetchPois();

    expect(result).toEqual([{ ...baseRow, linkedType: null, linkedId: null }]);
  });

  it("keeps a link whose target still exists", async () => {
    poiFindMany.mockResolvedValue([
      { ...baseRow, linkedType: "deity", linkedId: 3 },
    ]);
    deitiesFindMany.mockResolvedValue([{ id: 3 }]);

    const result = await fetchPois();

    expect(result[0]?.linkedType).toBe("deity");
    expect(result[0]?.linkedId).toBe(3);
  });

  it("degrades a link whose target was deleted to unlinked", async () => {
    poiFindMany.mockResolvedValue([
      { ...baseRow, linkedType: "npc", linkedId: 99 },
    ]);
    npcFindMany.mockResolvedValue([]); // target gone

    const result = await fetchPois();

    expect(result[0]?.linkedType).toBeNull();
    expect(result[0]?.linkedId).toBeNull();
  });

  it("degrades a linkedType outside LINKABLE_ENTITY_TYPES to unlinked", async () => {
    poiFindMany.mockResolvedValue([
      { ...baseRow, linkedType: "dungeon", linkedId: 1 },
    ]);

    const result = await fetchPois();

    expect(result[0]?.linkedType).toBeNull();
    expect(result[0]?.linkedId).toBeNull();
  });

  // SPEC-004 M2: `kind`, `parentId` and the map columns are additive — every
  // pre-existing row reads back with `kind: "poi"`, `parentId: null` and no
  // map. This locks in that a row shaped like that (as every row is, right
  // after the migration) still maps to exactly the same `Poi` this test file
  // already asserts elsewhere, with the new columns not leaking through.
  it("reads a row with M2's default tree columns unchanged", async () => {
    poiFindMany.mockResolvedValue([
      {
        ...baseRow,
        linkedType: null,
        linkedId: null,
        kind: "poi",
        parentId: null,
        mapImage: null,
        mapBounds: null,
        mapInitialView: null,
        mapInitialZoom: null,
      },
    ]);

    const result = await fetchPois();

    expect(result).toEqual([{ ...baseRow, linkedType: null, linkedId: null }]);
  });
});
