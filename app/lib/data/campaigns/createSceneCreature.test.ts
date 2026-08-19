import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { sceneCreature: { create } },
}));

import createSceneCreature from "./createSceneCreature";

const validFormData: SceneCreature = {
  id: 0,
  sceneId: 12,
  position: 1,
  name: "Bandit raider",
  level: 3,
  xpEach: 50,
  quantity: 4,
  note: "Armed with shortbows",
  awarded: false,
  npcId: null,
};

describe("createSceneCreature (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createSceneCreature(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the creature row on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createSceneCreature(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        name: "Bandit raider",
        level: 3,
        xpEach: 50,
        quantity: 4,
        note: "Armed with shortbows",
        npcId: null,
      },
    });
  });

  it("creates a creature linked to an existing NPC", async () => {
    create.mockResolvedValue({});

    const result = await createSceneCreature({ ...validFormData, npcId: 9 });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        name: "Bandit raider",
        level: 3,
        xpEach: 50,
        quantity: 4,
        note: "Armed with shortbows",
        npcId: 9,
      },
    });
  });

  it("rejects a blank name, without writing", async () => {
    const result = await createSceneCreature({ ...validFormData, name: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive quantity, without writing", async () => {
    const result = await createSceneCreature({ ...validFormData, quantity: 0 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("leaves an unset level as null rather than zero", async () => {
    create.mockResolvedValue({});

    const result = await createSceneCreature({ ...validFormData, level: null });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        sceneId: 12,
        position: 1,
        name: "Bandit raider",
        level: null,
        xpEach: 50,
        quantity: 4,
        note: "Armed with shortbows",
        npcId: null,
      },
    });
  });
});
