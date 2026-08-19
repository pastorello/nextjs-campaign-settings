import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { update } },
}));

import updateScene from "./updateScene";

const validFormData: Scene = {
  id: 12,
  adventureId: 7,
  position: 2,
  kind: SceneKind.Explore,
  title: "The flooded crypt",
  description: "A slow, dangerous descent.",
  xpAward: 150,
  grantsHeroPoint: true,
  awarded: true,
  zoneId: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-02"),
};

describe("updateScene (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateScene(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the scene's own fields, excluding adventureId/awarded/timestamps", async () => {
    update.mockResolvedValue({});

    const result = await updateScene(validFormData);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        position: 2,
        kind: SceneKind.Explore,
        title: "The flooded crypt",
        description: "A slow, dangerous descent.",
        xpAward: 150,
        grantsHeroPoint: true,
        zoneId: null,
      },
    });
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateScene({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("allows repositioning a scene explicitly", async () => {
    update.mockResolvedValue({});

    const result = await updateScene({ ...validFormData, position: 5 });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        position: 5,
        kind: SceneKind.Explore,
        title: "The flooded crypt",
        description: "A slow, dangerous descent.",
        xpAward: 150,
        grantsHeroPoint: true,
        zoneId: null,
      },
    });
  });
});
