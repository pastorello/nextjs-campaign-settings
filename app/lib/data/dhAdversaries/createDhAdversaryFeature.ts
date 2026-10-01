"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhAdversaryFeature from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryFeature";
import { dhAdversaryFeatureMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds a feature to an adversary (SPEC-028 T2, ADR-0011). `adversaryId` is
 * not part of the row's meta: the inline editor supplies it from the
 * adversary it is open on.
 */
export default async function createDhAdversaryFeature(
  formData: Omit<DhAdversaryFeature, "id">
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildBespokeCreateSchema(dhAdversaryFeatureMeta)
    .extend({ adversaryId: z.coerce.number().int().positive() })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); the built schema's output type is
  // widened, and this assertion narrows it back.
  const { adversaryId, position, kind, fear, name, text } = parsed.data as Omit<
    DhAdversaryFeature,
    "id"
  >;

  try {
    await prisma.dhAdversaryFeature.create({
      data: { adversaryId, position, kind, fear, name, text },
    });
  } catch (error) {
    throw toDatabaseError("creating adversary feature", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
