import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { update } },
}));

import updateZoneMap from "./updateZoneMap";

describe("updateZoneMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      updateZoneMap({ id: 1, mapImage: "kang.png" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes the map onto an existing zone", async () => {
    const result = await updateZoneMap({ id: 7, mapImage: "cieli.png" });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { mapImage: "cieli.png" },
    });
  });

  it("rejects a payload with no map, without writing", async () => {
    const result = await updateZoneMap({ id: 7, mapImage: "" });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateZoneMap({ id: -1, mapImage: "cieli.png" });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
