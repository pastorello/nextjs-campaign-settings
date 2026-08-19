import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { loot: { create } },
}));

import createLoot from "./createLoot";

const validFormData: Loot = {
  id: 0,
  sceneId: 12,
  position: 1,
  description: "A jade pendant on a silver chain",
  quantity: 1,
  value: 80,
  taken: false,
  magicItemId: null,
  treasureId: null,
};

describe("createLoot (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createLoot(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates an unlinked loot row on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createLoot(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        description: "A jade pendant on a silver chain",
        quantity: 1,
        value: 80,
        magicItemId: null,
        treasureId: null,
      },
    });
  });

  it("creates a loot row linked to a magic item", async () => {
    create.mockResolvedValue({});

    const result = await createLoot({ ...validFormData, magicItemId: 4 });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        description: "A jade pendant on a silver chain",
        quantity: 1,
        value: 80,
        magicItemId: 4,
        treasureId: null,
      },
    });
  });

  it("creates a loot row linked to a catalogue treasure", async () => {
    create.mockResolvedValue({});

    const result = await createLoot({ ...validFormData, treasureId: 6 });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        description: "A jade pendant on a silver chain",
        quantity: 1,
        value: 80,
        magicItemId: null,
        treasureId: 6,
      },
    });
  });

  it("rejects a loot row linked to both a magic item and a treasure, without writing", async () => {
    const result = await createLoot({
      ...validFormData,
      magicItemId: 4,
      treasureId: 6,
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a plot-item loot row with no value, counting toward no budget", async () => {
    create.mockResolvedValue({});

    const result = await createLoot({ ...validFormData, value: null });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        description: "A jade pendant on a silver chain",
        quantity: 1,
        value: null,
        magicItemId: null,
        treasureId: null,
      },
    });
  });

  it("rejects a blank description, without writing", async () => {
    const result = await createLoot({ ...validFormData, description: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
