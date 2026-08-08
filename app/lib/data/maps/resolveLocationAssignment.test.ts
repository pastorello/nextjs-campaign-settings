import { beforeEach, describe, expect, it, vi } from "vitest";

const { poiFindUnique, zoneFindUnique } = vi.hoisted(() => ({
  poiFindUnique: vi.fn(),
  zoneFindUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    poi: { findUnique: poiFindUnique },
    zone: { findUnique: zoneFindUnique },
  },
}));

import resolveLocationAssignment from "./resolveLocationAssignment";

describe("resolveLocationAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves both null (clearing to Sconosciuta) without any lookup", async () => {
    const result = await resolveLocationAssignment(null, null);

    expect(result).toEqual({ ok: true, zoneId: null, poiId: null });
    expect(poiFindUnique).not.toHaveBeenCalled();
    expect(zoneFindUnique).not.toHaveBeenCalled();
  });

  it("resolves a zone-only assignment when the zone exists", async () => {
    zoneFindUnique.mockResolvedValue({ id: 5 });

    const result = await resolveLocationAssignment(5, null);

    expect(result).toEqual({ ok: true, zoneId: 5, poiId: null });
  });

  it("rejects a zone-only assignment when the zone does not exist", async () => {
    zoneFindUnique.mockResolvedValue(null);

    const result = await resolveLocationAssignment(5, null);

    expect(result.ok).toBe(false);
  });

  it("resolves zoneId from the poi's own zoneId when a poi is chosen", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });

    const result = await resolveLocationAssignment(5, 9);

    expect(result).toEqual({ ok: true, zoneId: 5, poiId: 9 });
  });

  it("rejects a poi id that does not exist", async () => {
    poiFindUnique.mockResolvedValue(null);

    const result = await resolveLocationAssignment(5, 9);

    expect(result.ok).toBe(false);
  });

  it("rejects a zoneId that disagrees with the chosen poi's own zone", async () => {
    poiFindUnique.mockResolvedValue({ zoneId: 5 });

    const result = await resolveLocationAssignment(6, 9);

    expect(result.ok).toBe(false);
  });
});
