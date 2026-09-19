"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhClassFeature";
import dhClassFeatureMeta from "@/app/lib/config/daggerheart/dhClassFeatureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates one class feature's own fields. Written from
 * `dhClassFeatureMeta`'s field list: the feature's class is never moved.
 */
export default async function updateDhClassFeature(
  formData: Partial<DhClassFeature> & { id: number }
): Promise<MutationResult> {
  await requireSession();

  const parsed =
    buildBespokeUpdateSchema(dhClassFeatureMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data as Partial<
    Omit<DhClassFeature, "classId">
  > & { id: number };

  try {
    await prisma.dhClassFeature.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating class feature", error);
  }

  revalidateDashboard("admin/classes");
  return { ok: true };
}
