"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import fieldError from "@/app/lib/data/validation/fieldError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes one class feature — unless it is the class's last: a class has at
 * least one feature (SPEC-021 §5), and `createDhClass` creates it with one,
 * so refusing here is what keeps the invariant. A Server Action, like
 * `deleteSceneById`: features have no list page to fire a DELETE from.
 */
export default async function deleteDhClassFeatureById(
  id: number
): Promise<MutationResult> {
  await requireSession();

  let existing;
  try {
    existing = await prisma.dhClassFeature.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up class feature for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Class feature", id);
  }

  let featureCount;
  try {
    featureCount = await prisma.dhClassFeature.count({
      where: { classId: existing.classId },
    });
  } catch (error) {
    throw toDatabaseError("counting class features before deletion", error);
  }

  if (featureCount <= 1) {
    return { ok: false, errors: { id: [fieldError("classNeedsFeature")] } };
  }

  try {
    await prisma.dhClassFeature.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting class feature", error);
  }

  revalidateDashboard("admin/classes");
  return { ok: true };
}
