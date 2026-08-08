import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` so `create` exists before the (also hoisted) `vi.mock` factory
// below runs — a plain top-level `const` here hits a TDZ error, because a
// static `import createPoi from "./createPoi"` evaluates its own imports
// (including prisma) before this file's own top-level statements do.
//
// A direct reference, not `vi.mocked(prisma.poi.create)`: the latter trips
// `unbound-method` outside `__test__/**`, where the rule is off (TD-22) —
// see `fetchFilteredSpells.test.ts` for the same avoidance, there via a
// dynamic import instead.
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { create } },
}));

import createPoi from "./createPoi";

const validPayload = {
  title: "Shrine of Aerivel",
  lat: 10,
  lng: 20,
  category: "religion",
  zoneId: 5,
};

describe("createPoi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("writes a valid payload and returns the new id", async () => {
    create.mockResolvedValue({ id: 42 });

    const result = await createPoi(validPayload);

    expect(result).toEqual({ ok: true, id: 42 });
    expect(create).toHaveBeenCalledWith({ data: validPayload });
  });

  it("rejects an invalid payload without writing", async () => {
    const result = await createPoi({
      ...validPayload,
      category: "not-a-category",
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a payload with no zoneId, without writing", async () => {
    const result = await createPoi({
      ...validPayload,
      zoneId: undefined,
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
