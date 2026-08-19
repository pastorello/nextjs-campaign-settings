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
 * Rewrites every loot row's `position` within a scene to match
 * `orderedIds`' order, 1-indexed. Same shape and reasoning as
 * `reorderSceneCreatures`.
 */
export default async function reorderLoot(
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
    existing = await prisma.loot.findMany({
      where: { sceneId: parsed.data.sceneId },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up loot for reordering", error);
  }

  const existingIds = new Set(existing.map((loot) => loot.id));
  const givenIds = parsed.data.orderedIds;
  const matchesLootList =
    givenIds.length === existingIds.size &&
    givenIds.every((id) => existingIds.has(id));

  if (!matchesLootList) {
    return {
      ok: false,
      errors: {
        orderedIds: [
          "The given loot rows do not match this scene's current loot list.",
        ],
      },
    };
  }

  try {
    await prisma.$transaction(
      givenIds.map((id, index) =>
        prisma.loot.update({ where: { id }, data: { position: index + 1 } })
      )
    );
  } catch (error) {
    throw toDatabaseError("reordering loot", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
