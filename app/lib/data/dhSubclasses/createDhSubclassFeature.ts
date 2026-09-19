"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import dhSubclassFeatureMeta from "@/app/lib/config/daggerheart/dhSubclassFeatureMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds a feature to one of a subclass's tiers (SPEC-021 §5.5, ADR-0011).
 * `subclassId` comes from the subclass the inline editor is open on;
 * `position` is the feature's place within its tier.
 */
export default async function createDhSubclassFeature(
  formData: Omit<DhSubclassFeature, "id">
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeCreateSchema(dhSubclassFeatureMeta)
    .extend({ subclassId: z.coerce.number().int().positive() })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); the assertion narrows the widened type.
  const { subclassId, tier, position, name, text } = parsed.data as Omit<
    DhSubclassFeature,
    "id"
  >;

  try {
    await prisma.dhSubclassFeature.create({
      data: { subclassId, tier, position, name, text },
    });
  } catch (error) {
    throw toDatabaseError("creating subclass feature", error);
  }

  revalidateDashboard("admin/subclasses");
  return { ok: true };
}
