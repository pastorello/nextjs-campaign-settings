import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import rarity from "@/app/lib/config/magicitem/rarity";
import itemTypes from "@/app/lib/config/magicitem/item-types";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { magicitems: { create } },
}));

import createMagicItem from "./createMagicItem";

const validFormData: MagicItem = {
  id: 0,
  name: "Vorpal Sword",
  description: "A blade that cuts through anything.",
  type: firstOptionValue(itemTypes),
  rarity: firstOptionValue(rarity),
  attuned: false,
};

describe("createMagicItem (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createMagicItem(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the magic item on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createMagicItem(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: validFormData.name,
        description: validFormData.description,
        type: validFormData.type,
        rarity: validFormData.rarity,
        attuned: validFormData.attuned,
      },
    });
  });

  it("rejects a payload with an out-of-range rarity, without writing", async () => {
    const result = await createMagicItem({ ...validFormData, rarity: 99999 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
