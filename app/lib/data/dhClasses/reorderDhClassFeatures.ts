"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import validateAndReorder from "../campaigns/validateAndReorder";

const reorderSchema = z.object({
  classId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every feature's `position` within a class to match `orderedIds`'
 * order, 1-indexed, in one transaction; `orderedIds` must be exactly the
 * class's current features — see `validateAndReorder` (TD-125).
 */
export default async function reorderDhClassFeatures(
  classId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ classId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.dhClassFeature.findMany({
          where: { classId: parsed.data.classId },
          select: { id: true },
        })
      ).map((feature) => feature.id),
    buildPositionUpdate: (id, position) =>
      prisma.dhClassFeature.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "classFeatureOrderMismatch",
  });

  if (result.ok) revalidateDashboard("admin/classes");
  return result;
}
