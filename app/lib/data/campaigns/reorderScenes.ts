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
  adventureId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every scene's `position` within an adventure to match
 * `orderedIds`' order, 1-indexed — the bulk half of "explicit integer
 * position, editable" (`updateScene` is the single-row half). One
 * transaction, and `orderedIds` must be exactly the adventure's current
 * scenes — see `validateAndReorder` (TD-125) for the shared shape and
 * `reorderAdventures` for the same reasoning applied to a different table.
 */
export default async function reorderScenes(
  adventureId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ adventureId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.scene.findMany({
          where: { adventureId: parsed.data.adventureId },
          select: { id: true },
        })
      ).map((scene) => scene.id),
    buildPositionUpdate: (id, position) =>
      prisma.scene.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "sceneOrderMismatch",
  });

  if (result.ok) {
    revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  }
  return result;
}
