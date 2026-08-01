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
import createNpc from "@/app/lib/data/npc/createNpc";
import updateNpc from "@/app/lib/data/npc/updateNpc";
import createPoi from "@/app/lib/data/maps/createPoi";
import updatePoi from "@/app/lib/data/maps/updatePoi";
import deletePoi from "@/app/lib/data/maps/deletePoi";

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
      npc: model(),
      poi: { ...model(), findUnique: vi.fn(), delete: vi.fn() },
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
  { name: "createNpc", fn: createNpc, table: "npc", op: "create" },
  { name: "updateNpc", fn: updateNpc, table: "npc", op: "update" },
  { name: "createPoi", fn: createPoi, table: "poi", op: "create" },
  { name: "updatePoi", fn: updatePoi, table: "poi", op: "update" },
  // deletePoi takes a bare id, not a formData object — the `{ id: 1 }` call
  // below is still valid because the auth guard throws before the argument
  // is ever used. `findUnique` is the first Prisma call it would otherwise
  // reach.
  { name: "deletePoi", fn: deletePoi, table: "poi", op: "findUnique" },
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

      const spy = prisma[table][op];
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
