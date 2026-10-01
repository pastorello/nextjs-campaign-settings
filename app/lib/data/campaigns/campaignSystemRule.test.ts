import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import type Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import type Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import type Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  sceneCreate: vi.fn(),
  lootCreate: vi.fn(),
  adventureUpdate: vi.fn(),
  adventureFind: vi.fn(),
  campaignFind: vi.fn(),
  sceneFind: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    scene: { create: db.sceneCreate, findUnique: db.sceneFind },
    loot: { create: db.lootCreate },
    adventure: { update: db.adventureUpdate, findUnique: db.adventureFind },
    campaign: { findUnique: db.campaignFind },
  },
}));

import otherSystemFieldErrors from "./otherSystemFieldErrors";
import fetchRulesSystem from "./fetchRulesSystem";
import createScene from "./createScene";
import createLoot from "./createLoot";
import updateAdventure from "./updateAdventure";

const underSystem = (system: string | null) => {
  const campaign = system === null ? null : { system };
  db.adventureFind.mockResolvedValue({ campaign });
  db.sceneFind.mockResolvedValue({ adventure: { campaign } });
};

const lastData = (mock: typeof db.sceneCreate) =>
  (mock.mock.lastCall as [{ data: Record<string, unknown> }])[0].data;

// Invented content only (SPEC-018 §5).
const scene = {
  adventureId: 7,
  position: 1,
  kind: "fight",
  title: "Lantern ambush",
  description: null,
  zoneId: null,
} as unknown as Scene;

describe("otherSystemFieldErrors (SPEC-030 §9 decision 2)", () => {
  it("refuses another system's field that carries a value", () => {
    expect(
      otherSystemFieldErrors("scene", "daggerheart", { xpAward: 50 })
    ).toEqual({ xpAward: [{ key: "notInThisSystem" }] });
    expect(
      otherSystemFieldErrors("loot", "dnd5e", { gold: 3, dhLootId: 2 })
    ).toEqual({
      gold: [{ key: "notInThisSystem" }],
      dhLootId: [{ key: "notInThisSystem" }],
    });
  });

  it("lets a form send the other system's blanks", () => {
    expect(
      otherSystemFieldErrors("adventure", "daggerheart", {
        xpTarget: null,
        currencyUnit: "",
        grantsHeroPoint: false,
      })
    ).toBeNull();
    expect(
      otherSystemFieldErrors("scene", "dnd5e", {
        milestone: false,
        battleAdjustments: [],
      })
    ).toBeNull();
  });
});

describe("fetchRulesSystem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads a row's campaign system, and 5e for a standalone adventure", async () => {
    underSystem("daggerheart");
    await expect(fetchRulesSystem({ sceneId: 3 })).resolves.toBe("daggerheart");

    underSystem(null);
    await expect(fetchRulesSystem({ adventureId: 7 })).resolves.toBe("dnd5e");
    await expect(fetchRulesSystem({ campaignId: null })).resolves.toBe("dnd5e");
  });

  it("reads an unknown system as 5e", async () => {
    underSystem("pf2");
    await expect(fetchRulesSystem({ adventureId: 7 })).resolves.toBe("dnd5e");
  });
});

describe("the campaign writes under each system (SPEC-030 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    db.sceneCreate.mockResolvedValue({});
    db.lootCreate.mockResolvedValue({});
    db.adventureUpdate.mockResolvedValue({});
  });

  it("writes a Daggerheart scene's milestone and adjustments", async () => {
    underSystem("daggerheart");

    await expect(
      createScene({
        ...scene,
        milestone: true,
        battleAdjustments: ["harderOrLonger"],
      })
    ).resolves.toEqual({ ok: true });
    expect(lastData(db.sceneCreate)).toMatchObject({
      milestone: true,
      battleAdjustments: ["harderOrLonger"],
    });
  });

  it("refuses an XP award on a Daggerheart scene, and a milestone on a 5e one", async () => {
    underSystem("daggerheart");
    await expect(createScene({ ...scene, xpAward: 50 })).resolves.toEqual({
      ok: false,
      errors: { xpAward: [{ key: "notInThisSystem" }] },
    });

    underSystem("dnd5e");
    await expect(createScene({ ...scene, milestone: true })).resolves.toEqual({
      ok: false,
      errors: { milestone: [{ key: "notInThisSystem" }] },
    });
    expect(db.sceneCreate).not.toHaveBeenCalled();
  });

  it("writes a 5e scene without the Daggerheart columns", async () => {
    underSystem("dnd5e");

    await createScene({ ...scene, xpAward: 50 });
    expect(lastData(db.sceneCreate)).not.toHaveProperty("milestone");
  });

  it("writes Daggerheart loot's gold and link, and refuses two links", async () => {
    underSystem("daggerheart");
    const loot = {
      sceneId: 3,
      position: 1,
      description: "A tarnished hook",
      quantity: 1,
      gold: 4,
      dhWeaponId: 2,
    } as unknown as Loot;

    await expect(createLoot(loot)).resolves.toEqual({ ok: true });
    expect(lastData(db.lootCreate)).toMatchObject({ gold: 4, dhWeaponId: 2 });

    await expect(createLoot({ ...loot, dhArmorId: 5 })).resolves.toEqual({
      ok: false,
      errors: { dhArmorId: [{ key: "lootLinksBoth" }] },
    });
  });

  it("takes a Daggerheart adventure's gold target, and refuses its XP target", async () => {
    underSystem("daggerheart");

    await expect(
      updateAdventure({ id: 7, goldTarget: 30 } as Adventure)
    ).resolves.toEqual({ ok: true });
    await expect(
      updateAdventure({ id: 7, xpTarget: 900 } as Adventure)
    ).resolves.toEqual({
      ok: false,
      errors: { xpTarget: [{ key: "notInThisSystem" }] },
    });
  });
});
