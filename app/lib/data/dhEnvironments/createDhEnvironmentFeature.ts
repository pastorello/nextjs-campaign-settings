"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhEnvironmentFeature from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironmentFeature";
import { dhEnvironmentFeatureMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds a feature to an environment (SPEC-028 T3, ADR-0011). `environmentId` is
 * not part of the row's meta: the inline editor supplies it from the
 * environment it is open on.
 */
export default async function createDhEnvironmentFeature(
  formData: Omit<DhEnvironmentFeature, "id">
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildBespokeCreateSchema(dhEnvironmentFeatureMeta)
    .extend({ environmentId: z.coerce.number().int().positive() })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); the built schema's output type is
  // widened, and this assertion narrows it back.
  const { environmentId, position, kind, name, text, questions } =
    parsed.data as Omit<DhEnvironmentFeature, "id">;

  try {
    await prisma.dhEnvironmentFeature.create({
      data: { environmentId, position, kind, name, text, questions },
    });
  } catch (error) {
    throw toDatabaseError("creating environment feature", error);
  }

  revalidateDashboard("environments");
  return { ok: true };
}
