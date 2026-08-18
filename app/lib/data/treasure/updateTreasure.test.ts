import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import treasureCategories from "@/app/lib/config/treasure/treasure-categories";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { treasure: { update } },
}));

import updateTreasure from "./updateTreasure";

const validFormData: Treasure = {
  id: 42,
  name: "Tharun d'argento",
  description: "A silver coin minted by the old empire.",
  category: firstOptionValue(treasureCategories),
  value: 20,
};

describe("updateTreasure (SPEC-013 T4b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateTreasure(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the treasure entry on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateTreasure(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: rest,
    });
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updateTreasure({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a payload with an out-of-range category, without writing", async () => {
    const result = await updateTreasure({ ...validFormData, category: 99999 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
