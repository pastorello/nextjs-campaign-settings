import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.poi.update)`.
const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { update } },
}));

import updatePoi from "./updatePoi";

describe("updatePoi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("writes a partial payload carrying only the edited field", async () => {
    const result = await updatePoi({ id: 1, title: "Renamed shrine" });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { title: "Renamed shrine" },
    });
  });

  it("refuses to reassign the zone, and writes nothing (SPEC-017 T6)", async () => {
    // `zoneId` left this payload entirely: a landmark's zone is its tree
    // edge, written only by `placeLandmark`, which also carries every
    // attached entity's `zoneId` along with it (ADR-0010). This function
    // could write it and maintained none of that.
    const result = await updatePoi({
      id: 1,
      // @ts-expect-error -- the point of the test: not in `PoiUpdateInput`
      zoneId: 7,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("leaves every field untouched when omitted", async () => {
    await updatePoi({ id: 1, title: "Renamed shrine" });

    const call = update.mock.calls[0]?.[0] as { data: object };
    expect(call.data).not.toHaveProperty("zoneId");
    expect(call.data).not.toHaveProperty("category");
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updatePoi({ id: -1, title: "x" });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
