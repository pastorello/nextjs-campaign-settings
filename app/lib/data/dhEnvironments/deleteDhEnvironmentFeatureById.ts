"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes one environment feature (SPEC-028 T3). A Server Action: the rows have
 * no list page to fire a DELETE from.
 */
export default async function deleteDhEnvironmentFeatureById(
  id: number
): Promise<MutationResult> {
  await requireDm();

  let existing;
  try {
    existing = await prisma.dhEnvironmentFeature.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up environment feature for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Environment feature", id);
  }

  try {
    await prisma.dhEnvironmentFeature.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting environment feature", error);
  }

  revalidateDashboard("environments");
  return { ok: true };
}
