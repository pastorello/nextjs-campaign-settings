import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { create } },
}));

import createScene from "./createScene";

const validFormData: Scene = {
  id: 0,
  adventureId: 7,
  position: 1,
  kind: SceneKind.Fight,
  title: "Ambush at the ford",
  description: "Bandits strike as the party crosses.",
  xpAward: 200,
  grantsHeroPoint: false,
  awarded: false,
  zoneId: 3,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("createScene (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createScene(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the scene on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createScene(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        adventureId: 7,
        position: 1,
        kind: SceneKind.Fight,
        title: "Ambush at the ford",
        description: "Bandits strike as the party crosses.",
        xpAward: 200,
        grantsHeroPoint: false,
        zoneId: 3,
      },
    });
  });

  it("creates a scene with no place assigned", async () => {
    create.mockResolvedValue({});

    const result = await createScene({ ...validFormData, zoneId: null });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        adventureId: 7,
        position: 1,
        kind: SceneKind.Fight,
        title: "Ambush at the ford",
        description: "Bandits strike as the party crosses.",
        xpAward: 200,
        grantsHeroPoint: false,
        zoneId: null,
      },
    });
  });

  it("rejects a blank title, without writing", async () => {
    const result = await createScene({ ...validFormData, title: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an invalid kind, without writing", async () => {
    const result = await createScene({
      ...validFormData,
      kind: "ritual" as SceneKind,
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
