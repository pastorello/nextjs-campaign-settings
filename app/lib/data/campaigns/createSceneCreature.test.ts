import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// SPEC-030: a 5e campaign's row; the per-system rule has its own suite.
// SPEC-031 switches it to Daggerheart for one test.
const rules = vi.hoisted(() => ({ system: "dnd5e" }));
vi.mock("./fetchRulesSystem", () => ({
  default: () => Promise.resolve(rules.system),
}));

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
    rules.system = "dnd5e";
    vi.mocked(auth).mockResolvedValue({
      user: { name: "dm", role: "dm" },
    } as never);
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
        statsUrl: null,
        challengeRating: null,
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
        statsUrl: null,
        challengeRating: null,
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
        statsUrl: null,
        challengeRating: null,
      },
    });
  });

  describe("statistics link and challenge rating (SPEC-031 T2)", () => {
    const written = () =>
      (create.mock.lastCall as [{ data: Record<string, unknown> }])[0].data;

    it("writes an http/https link and a challenge rating", async () => {
      create.mockResolvedValue({});

      const result = await createSceneCreature({
        ...validFormData,
        statsUrl: "https://example.com/bestiary/bandit",
        challengeRating: "1/8",
      });

      expect(result).toEqual({ ok: true });
      expect(written()).toMatchObject({
        statsUrl: "https://example.com/bestiary/bandit",
        challengeRating: "1/8",
      });
    });

    it("stores a blank link and CR as null, which the CHECKs admit", async () => {
      create.mockResolvedValue({});

      await createSceneCreature({
        ...validFormData,
        statsUrl: "  ",
        challengeRating: "" as never,
      });

      expect(written()).toMatchObject({
        statsUrl: null,
        challengeRating: null,
      });
    });

    it.each(["javascript:alert(1)", "ftp://example.com/x", "Bestiary p. 12"])(
      "refuses the link %s, field by field, without writing",
      async (statsUrl) => {
        const result = await createSceneCreature({
          ...validFormData,
          statsUrl,
        });

        expect(result.ok).toBe(false);
        expect(!result.ok && Object.keys(result.errors)).toEqual(["statsUrl"]);
        expect(create).not.toHaveBeenCalled();
      }
    );

    it("refuses a challenge rating outside the list", async () => {
      const result = await createSceneCreature({
        ...validFormData,
        challengeRating: "31" as never,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && Object.keys(result.errors)).toEqual([
        "challengeRating",
      ]);
      expect(create).not.toHaveBeenCalled();
    });

    it("refuses a challenge rating on a Daggerheart row, but takes its link", async () => {
      rules.system = "daggerheart";
      const daggerheartRow = {
        ...validFormData,
        level: null,
        xpEach: null,
        statsUrl: "https://example.com/adversaries/lantern-wraith",
      };

      const refused = await createSceneCreature({
        ...daggerheartRow,
        challengeRating: "2",
      });
      expect(refused).toEqual({
        ok: false,
        errors: { challengeRating: [{ key: "notInThisSystem" }] },
      });
      expect(create).not.toHaveBeenCalled();

      create.mockResolvedValue({});
      expect(await createSceneCreature(daggerheartRow)).toEqual({ ok: true });
      expect(written()).toMatchObject({
        statsUrl: "https://example.com/adversaries/lantern-wraith",
        challengeRating: null,
      });
    });
  });
});
