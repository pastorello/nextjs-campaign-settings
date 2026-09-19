"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes one subclass feature. A Server Action, like `deleteSceneById`:
 * features have no list page to fire a DELETE from. A subclass may be left
 * with none — only a class needs at least one feature (SPEC-021 §5).
 */
export default async function deleteDhSubclassFeatureById(
  id: number
): Promise<void> {
  await requireSession();

  let existing;
  try {
    existing = await prisma.dhSubclassFeature.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up subclass feature for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Subclass feature", id);
  }

  try {
    await prisma.dhSubclassFeature.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting subclass feature", error);
  }

  revalidateDashboard("admin/subclasses");
}
