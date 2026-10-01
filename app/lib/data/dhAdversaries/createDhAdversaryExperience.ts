"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhAdversaryExperience from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryExperience";
import { dhAdversaryExperienceMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds an experience to an adversary (SPEC-028 T2, ADR-0011). `adversaryId` is
 * not part of the row's meta: the inline editor supplies it from the
 * adversary it is open on.
 */
export default async function createDhAdversaryExperience(
  formData: Omit<DhAdversaryExperience, "id">
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildBespokeCreateSchema(dhAdversaryExperienceMeta)
    .extend({ adversaryId: z.coerce.number().int().positive() })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); the built schema's output type is
  // widened, and this assertion narrows it back.
  const { adversaryId, position, name, bonus } = parsed.data as Omit<
    DhAdversaryExperience,
    "id"
  >;

  try {
    await prisma.dhAdversaryExperience.create({
      data: { adversaryId, position, name, bonus },
    });
  } catch (error) {
    throw toDatabaseError("creating adversary experience", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
