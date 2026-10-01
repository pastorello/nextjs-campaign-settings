"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhEnvironmentFeature from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironmentFeature";
import { dhEnvironmentFeatureMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates one environment feature's own fields (SPEC-028 T3). Written from its
 * meta's field list: the row's environment is never moved.
 */
export default async function updateDhEnvironmentFeature(
  formData: Partial<DhEnvironmentFeature> & { id: number }
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildBespokeUpdateSchema(dhEnvironmentFeatureMeta).safeParse(
    formData
  );
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data as Partial<
    Omit<DhEnvironmentFeature, "environmentId">
  > & { id: number };

  try {
    await prisma.dhEnvironmentFeature.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating environment feature", error);
  }

  revalidateDashboard("environments");
  return { ok: true };
}
