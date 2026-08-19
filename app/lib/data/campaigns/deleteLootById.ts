"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes a loot row. Same shape as `deleteSceneCreatureById` — a Server
 * Action, since there is no admin list page for loot rows to fire a
 * `fetch(DELETE)` from.
 */
export default async function deleteLootById(id: number): Promise<void> {
  await requireSession();

  let existingItem;
  try {
    existingItem = await prisma.loot.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up loot for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Loot", id);
  }

  try {
    await prisma.loot.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting loot", error);
  }

  revalidatePath("/dashboard/campaign");
}
