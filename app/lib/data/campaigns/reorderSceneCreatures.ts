"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const reorderSchema = z.object({
  sceneId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every creature row's `position` within a scene to match
 * `orderedIds`' order, 1-indexed. Same shape and reasoning as
 * `reorderScenes`.
 */
export default async function reorderSceneCreatures(
  sceneId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ sceneId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let existing;
  try {
    existing = await prisma.sceneCreature.findMany({
      where: { sceneId: parsed.data.sceneId },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up scene creatures for reordering", error);
  }

  const existingIds = new Set(existing.map((creature) => creature.id));
  const givenIds = parsed.data.orderedIds;
  const matchesCreatureList =
    givenIds.length === existingIds.size &&
    givenIds.every((id) => existingIds.has(id));

  if (!matchesCreatureList) {
    return {
      ok: false,
      errors: {
        orderedIds: [
          "The given creatures do not match this scene's current creature list.",
        ],
      },
    };
  }

  try {
    await prisma.$transaction(
      givenIds.map((id, index) =>
        prisma.sceneCreature.update({
          where: { id },
          data: { position: index + 1 },
        })
      )
    );
  } catch (error) {
    throw toDatabaseError("reordering scene creatures", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
