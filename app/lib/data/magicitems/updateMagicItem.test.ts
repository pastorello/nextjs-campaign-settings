import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import rarity from "@/app/lib/config/magicitem/rarity";
import itemTypes from "@/app/lib/config/magicitem/item-types";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { magicitems: { update } },
}));

import updateMagicItem from "./updateMagicItem";

const validFormData: MagicItem = {
  id: 42,
  name: "Vorpal Sword",
  description: "A blade that cuts through anything.",
  type: firstOptionValue(itemTypes),
  rarity: firstOptionValue(rarity),
  attuned: false,
  consumable: false,
};

describe("updateMagicItem (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateMagicItem(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the magic item on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateMagicItem(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: rest,
    });
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updateMagicItem({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a payload with an out-of-range rarity, without writing", async () => {
    const result = await updateMagicItem({ ...validFormData, rarity: 99999 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
