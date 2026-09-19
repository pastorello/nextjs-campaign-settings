"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import validateAndReorder from "../campaigns/validateAndReorder";

const reorderSchema = z.object({
  subclassId: z.coerce.number().int().positive(),
  tier: z.nativeEnum(DhSubclassFeatureTier),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites the `position` of every feature in one of a subclass's tiers to
 * match `orderedIds`' order, 1-indexed, in one transaction. Features are
 * ordered within their tier (SPEC-021 §6), so `orderedIds` must be exactly
 * that tier's current features — see `validateAndReorder` (TD-125).
 */
export default async function reorderDhSubclassFeatures(
  subclassId: number,
  tier: DhSubclassFeatureTier,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ subclassId, tier, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.dhSubclassFeature.findMany({
          where: { subclassId: parsed.data.subclassId, tier: parsed.data.tier },
          select: { id: true },
        })
      ).map((feature) => feature.id),
    buildPositionUpdate: (id, position) =>
      prisma.dhSubclassFeature.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "subclassFeatureOrderMismatch",
  });

  if (result.ok) revalidateDashboard("admin/subclasses");
  return result;
}
