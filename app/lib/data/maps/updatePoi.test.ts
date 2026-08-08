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

  it("writes a new zoneId when reassigned to a different one", async () => {
    await updatePoi({ id: 1, zoneId: 7 });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { zoneId: 7 },
    });
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
