import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { loot: { update } },
}));

import updateLoot from "./updateLoot";

const validFormData: Loot = {
  id: 33,
  sceneId: 12,
  position: 2,
  description: "A pouch of gold coins",
  quantity: 1,
  value: 150,
  taken: true,
  magicItemId: null,
  treasureId: 6,
};

describe("updateLoot (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateLoot(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the loot row's own fields, excluding sceneId/taken", async () => {
    update.mockResolvedValue({});

    const result = await updateLoot(validFormData);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 33 },
      data: {
        position: 2,
        description: "A pouch of gold coins",
        quantity: 1,
        value: 150,
        magicItemId: null,
        treasureId: 6,
      },
    });
  });

  it("rejects linking both a magic item and a treasure, without writing", async () => {
    const result = await updateLoot({
      ...validFormData,
      magicItemId: 4,
      treasureId: 6,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateLoot({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a blank description, without writing", async () => {
    const result = await updateLoot({ ...validFormData, description: "" });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
