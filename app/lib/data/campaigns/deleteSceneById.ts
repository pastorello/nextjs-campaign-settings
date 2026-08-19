"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes a scene and, by the schema's own cascade, every creature and
 * loot row it contains (SPEC-013 §6: `sceneCreature.sceneId` and
 * `loot.sceneId` are both `onDelete: Cascade`). Same shape as
 * `deleteAdventureById` — a Server Action, since there is no admin list
 * page for scenes to fire a `fetch(DELETE)` from.
 */
export default async function deleteSceneById(id: number): Promise<void> {
  await requireSession();

  let existingItem;
  try {
    existingItem = await prisma.scene.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up scene for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Scene", id);
  }

  try {
    await prisma.scene.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting scene", error);
  }

  revalidatePath("/dashboard/campaign");
}
