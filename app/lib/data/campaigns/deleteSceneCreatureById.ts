"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes a creature row. Same shape as `deleteSceneById` — a Server
 * Action, since there is no admin list page for scene creatures to fire a
 * `fetch(DELETE)` from.
 */
export default async function deleteSceneCreatureById(
  id: number
): Promise<void> {
  await requireSession();

  let existingItem;
  try {
    existingItem = await prisma.sceneCreature.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up scene creature for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Scene creature", id);
  }

  try {
    await prisma.sceneCreature.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting scene creature", error);
  }

  revalidatePath("/dashboard/campaign");
}
