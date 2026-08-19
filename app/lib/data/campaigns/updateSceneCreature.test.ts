import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { sceneCreature: { update } },
}));

import updateSceneCreature from "./updateSceneCreature";

const validFormData: SceneCreature = {
  id: 21,
  sceneId: 12,
  position: 2,
  name: "Bandit captain",
  level: 5,
  xpEach: 200,
  quantity: 1,
  note: "",
  awarded: true,
  npcId: 3,
};

describe("updateSceneCreature (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateSceneCreature(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the creature's own fields, excluding sceneId/awarded", async () => {
    update.mockResolvedValue({});

    const result = await updateSceneCreature(validFormData);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        position: 2,
        name: "Bandit captain",
        level: 5,
        xpEach: 200,
        quantity: 1,
        note: "",
        npcId: 3,
      },
    });
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateSceneCreature({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a blank name, without writing", async () => {
    const result = await updateSceneCreature({ ...validFormData, name: "" });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
