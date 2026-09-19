"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import dhSubclassFeatureMeta from "@/app/lib/config/daggerheart/dhSubclassFeatureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates one subclass feature's own fields, its tier included. A feature
 * moved to another tier is sent with its new place there — the end of that
 * tier — by the inline editor.
 */
export default async function updateDhSubclassFeature(
  formData: Partial<DhSubclassFeature> & { id: number }
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeUpdateSchema(dhSubclassFeatureMeta).safeParse(
    formData
  );
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data as Partial<
    Omit<DhSubclassFeature, "subclassId">
  > & { id: number };

  try {
    await prisma.dhSubclassFeature.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating subclass feature", error);
  }

  revalidateDashboard("admin/subclasses");
  return { ok: true };
}
