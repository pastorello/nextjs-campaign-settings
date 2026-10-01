"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhAdversaryExperience from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryExperience";
import { dhAdversaryExperienceMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates one adversary experience's own fields (SPEC-028 T2). Written from its
 * meta's field list: the row's adversary is never moved.
 */
export default async function updateDhAdversaryExperience(
  formData: Partial<DhAdversaryExperience> & { id: number }
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildBespokeUpdateSchema(dhAdversaryExperienceMeta).safeParse(
    formData
  );
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data as Partial<
    Omit<DhAdversaryExperience, "adversaryId">
  > & { id: number };

  try {
    await prisma.dhAdversaryExperience.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating adversary experience", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
