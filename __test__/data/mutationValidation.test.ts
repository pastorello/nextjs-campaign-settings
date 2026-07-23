import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import prisma from "@/app/lib/connections/prisma";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import PageType from "@/app/lib/definitions/types/PageType";
import { entityFieldKeys } from "@/app/lib/data/validation/buildEntitySchema";

import createSpell from "@/app/lib/data/spells/createSpell";
import updateSpell from "@/app/lib/data/spells/updateSpell";
import createDeity from "@/app/lib/data/deities/createDeity";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";
import createPng from "@/app/lib/data/png/createPng";
import updatePng from "@/app/lib/data/png/updatePng";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => {
  const model = () => ({ create: vi.fn(), update: vi.fn() });
  return {
    default: {
      spells: model(),
      deities: model(),
      magicitems: model(),
      png: model(),
    },
  };
});

// A payload of each field's declared default — the shape a real form submits.
function validPayload(pageType: PageType): Record<string, unknown> {
  return Object.fromEntries(
    entityFieldKeys[pageType].map((key) => [
      key,
      pageMetaFields[key].defaultValue,
    ])
  );
}

const domains = [
  {
    name: "spells",
    table: "spells",
    type: PageType.Spell,
    create: createSpell,
    update: updateSpell,
  },
  {
    name: "deities",
    table: "deities",
    type: PageType.Deity,
    create: createDeity,
    update: updateDeity,
  },
  {
    name: "magicitems",
    table: "magicitems",
    type: PageType.MagicItem,
    create: createMagicItem,
    update: updateMagicItem,
  },
  {
    name: "png",
    table: "png",
    type: PageType.Png,
    create: createPng,
    update: updatePng,
  },
] as const;

describe("mutation input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  describe.each(domains)("$name", ({ table, type, create, update }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = () => (prisma as any)[table];

    it("writes a valid create payload", async () => {
      const result = await create(validPayload(type) as never);

      expect(result).toEqual({ ok: true });
      expect(model().create).toHaveBeenCalledTimes(1);
    });

    it("rejects an empty create payload without writing", async () => {
      const result = await create({} as never);

      expect(result.ok).toBe(false);
      expect(model().create).not.toHaveBeenCalled();
    });

    it("returns field-keyed errors naming the offending field", async () => {
      const payload = { ...validPayload(type), nome: 42 };

      const result = await create(payload as never);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(Object.keys(result.errors)).toContain("nome");
      }
      expect(model().create).not.toHaveBeenCalled();
    });

    it("rejects an update with no id without writing", async () => {
      const result = await update({ nome: "valido" } as never);

      expect(result.ok).toBe(false);
      expect(model().update).not.toHaveBeenCalled();
    });

    it("accepts a partial update carrying only an edited field", async () => {
      const result = await update({ id: 7, nome: "Nuovo nome" } as never);

      expect(result).toEqual({ ok: true });
      expect(model().update).toHaveBeenCalledTimes(1);
    });
  });
});
