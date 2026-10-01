"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes one adversary feature (SPEC-028 T2). A Server Action: the rows have
 * no list page to fire a DELETE from.
 */
export default async function deleteDhAdversaryFeatureById(
  id: number
): Promise<MutationResult> {
  await requireDm();

  let existing;
  try {
    existing = await prisma.dhAdversaryFeature.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up adversary feature for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Adversary feature", id);
  }

  try {
    await prisma.dhAdversaryFeature.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting adversary feature", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
