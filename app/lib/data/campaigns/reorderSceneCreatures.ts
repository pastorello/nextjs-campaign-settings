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
 * Rewrites every creature row's `position` within a scene to match
 * `orderedIds`' order, 1-indexed. Same shape and reasoning as
 * `reorderScenes` — see `validateAndReorder` (TD-125) for the shared logic.
 */
export default async function reorderSceneCreatures(
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
        await prisma.sceneCreature.findMany({
          where: { sceneId: parsed.data.sceneId },
          select: { id: true },
        })
      ).map((creature) => creature.id),
    buildPositionUpdate: (id, position) =>
      prisma.sceneCreature.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "sceneCreatureOrderMismatch",
  });

  if (result.ok) {
    revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  }
  return result;
}
