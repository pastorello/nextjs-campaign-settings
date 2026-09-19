"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhClassFeature";
import dhClassFeatureMeta from "@/app/lib/config/daggerheart/dhClassFeatureMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds a feature to a class (SPEC-021 §5.4, ADR-0011). `classId` is not part
 * of `dhClassFeatureMeta` — the inline editor supplies it from the class it
 * is open on, the same split `createScene` uses for `adventureId`.
 */
export default async function createDhClassFeature(
  formData: Omit<DhClassFeature, "id">
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeCreateSchema(dhClassFeatureMeta)
    .extend({ classId: z.coerce.number().int().positive() })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); the built schema's output type is
  // widened, and this assertion narrows it back.
  const { classId, position, name, text } = parsed.data as Omit<
    DhClassFeature,
    "id"
  >;

  try {
    await prisma.dhClassFeature.create({
      data: { classId, position, name, text },
    });
  } catch (error) {
    throw toDatabaseError("creating class feature", error);
  }

  revalidateDashboard("admin/classes");
  return { ok: true };
}
