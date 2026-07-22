import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import prisma from "@/app/lib/connections/prisma";

import createSpell from "@/app/lib/data/spells/createSpell";
import updateSpell from "@/app/lib/data/spells/updateSpell";
import createDeity from "@/app/lib/data/deities/createDeity";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";
import createPng from "@/app/lib/data/png/createPng";
import updatePng from "@/app/lib/data/png/updatePng";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

// A Prisma double whose every model.method is a spy. If the guard works, none
// of these is ever reached — that is exactly what the test asserts. The factory
// is hoisted, so the model helper is defined inside it.
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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mutations = [
  { name: "createSpell", fn: createSpell, table: "spells", op: "create" },
  { name: "updateSpell", fn: updateSpell, table: "spells", op: "update" },
  { name: "createDeity", fn: createDeity, table: "deities", op: "create" },
  { name: "updateDeity", fn: updateDeity, table: "deities", op: "update" },
  { name: "createMagicItem", fn: createMagicItem, table: "magicitems", op: "create" }, // prettier-ignore
  { name: "updateMagicItem", fn: updateMagicItem, table: "magicitems", op: "update" }, // prettier-ignore
  { name: "createPng", fn: createPng, table: "png", op: "create" },
  { name: "updatePng", fn: updatePng, table: "png", op: "update" },
] as const;

describe("mutation auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(mutations)("$name", ({ fn, table, op }) => {
    it("throws UnauthorizedError and never writes without a session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      await expect(fn({ id: 1 } as never)).rejects.toBeInstanceOf(
        UnauthorizedError
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = (prisma as any)[table][op];
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
