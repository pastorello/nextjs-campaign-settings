"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes an adventure and, by the schema's own cascade, every scene it
 * contains (SPEC-013 §6: `scene.adventureId` is `onDelete: Cascade`). Same
 * shape as `deletePoi` — a Server Action rather than a route handler, since
 * there is no admin list page for adventures to fire a `fetch(DELETE)` from,
 * only the bespoke ladder (T7).
 */
export default async function deleteAdventureById(id: number): Promise<void> {
  await requireSession();

  let existingItem;
  try {
    existingItem = await prisma.adventure.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up adventure for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Adventure", id);
  }

  try {
    await prisma.adventure.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting adventure", error);
  }

  revalidatePath("/dashboard/campaign");
}
