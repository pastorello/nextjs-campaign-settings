"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes one adversary experience (SPEC-028 T2). A Server Action: the rows have
 * no list page to fire a DELETE from.
 */
export default async function deleteDhAdversaryExperienceById(
  id: number
): Promise<MutationResult> {
  await requireDm();

  let existing;
  try {
    existing = await prisma.dhAdversaryExperience.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError(
      "looking up adversary experience for deletion",
      error
    );
  }

  if (!existing) {
    throw new NotFoundError("Adversary experience", id);
  }

  try {
    await prisma.dhAdversaryExperience.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting adversary experience", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
