import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { loot: { update } },
}));

import setLootTaken from "./setLootTaken";

describe("setLootTaken (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(setLootTaken(1, true)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("sets taken to true", async () => {
    update.mockResolvedValue({});

    const result = await setLootTaken(1, true);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { taken: true },
    });
  });

  it("is idempotent under a repeated identical call", async () => {
    update.mockResolvedValue({});

    await setLootTaken(1, true);
    await setLootTaken(1, true);

    expect(update).toHaveBeenCalledTimes(2);
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await setLootTaken(-1, true);

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
