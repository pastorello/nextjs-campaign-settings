"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const reorderSchema = z.object({
  adventureId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every scene's `position` within an adventure to match
 * `orderedIds`' order, 1-indexed — the bulk half of "explicit integer
 * position, editable" (`updateScene` is the single-row half). One
 * transaction, and `orderedIds` must be exactly the adventure's current
 * scenes — see `reorderAdventures` for the same shape and reasoning.
 */
export default async function reorderScenes(
  adventureId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ adventureId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let existing;
  try {
    existing = await prisma.scene.findMany({
      where: { adventureId: parsed.data.adventureId },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up scenes for reordering", error);
  }

  const existingIds = new Set(existing.map((scene) => scene.id));
  const givenIds = parsed.data.orderedIds;
  const matchesSceneList =
    givenIds.length === existingIds.size &&
    givenIds.every((id) => existingIds.has(id));

  if (!matchesSceneList) {
    return {
      ok: false,
      errors: {
        orderedIds: [
          "The given scenes do not match this adventure's current scene list.",
        ],
      },
    };
  }

  try {
    await prisma.$transaction(
      givenIds.map((id, index) =>
        prisma.scene.update({ where: { id }, data: { position: index + 1 } })
      )
    );
  } catch (error) {
    throw toDatabaseError("reordering scenes", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
