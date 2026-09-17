"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import validateAndReorder from "./validateAndReorder";

const reorderSchema = z.object({
  sceneId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every loot row's `position` within a scene to match
 * `orderedIds`' order, 1-indexed. Same shape and reasoning as
 * `reorderSceneCreatures` — see `validateAndReorder` (TD-125) for the
 * shared logic.
 */
export default async function reorderLoot(
  sceneId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ sceneId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.loot.findMany({
          where: { sceneId: parsed.data.sceneId },
          select: { id: true },
        })
      ).map((loot) => loot.id),
    buildPositionUpdate: (id, position) =>
      prisma.loot.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "lootOrderMismatch",
  });

  if (result.ok) {
    revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  }
  return result;
}
