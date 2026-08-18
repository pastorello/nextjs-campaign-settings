import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import treasureCategories from "@/app/lib/config/treasure/treasure-categories";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { treasure: { create } },
}));

import createTreasure from "./createTreasure";

const validFormData: Treasure = {
  id: 0,
  name: "Tharun d'argento",
  description: "A silver coin minted by the old empire.",
  category: firstOptionValue(treasureCategories),
  value: 20,
};

describe("createTreasure (SPEC-013 T4b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createTreasure(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the treasure entry on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createTreasure(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: validFormData.name,
        description: validFormData.description,
        category: validFormData.category,
        value: validFormData.value,
      },
    });
  });

  it("rejects a payload with an out-of-range category, without writing", async () => {
    const result = await createTreasure({ ...validFormData, category: 99999 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a negative value, without writing", async () => {
    const result = await createTreasure({ ...validFormData, value: -10 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates with no value entered", async () => {
    create.mockResolvedValue({});

    const result = await createTreasure({ ...validFormData, value: null });

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: validFormData.name,
        description: validFormData.description,
        category: validFormData.category,
        value: null,
      },
    });
  });
});
