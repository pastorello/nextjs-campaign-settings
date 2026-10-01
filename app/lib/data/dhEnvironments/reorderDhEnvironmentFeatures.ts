"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import validateAndReorder from "../campaigns/validateAndReorder";

const reorderSchema = z.object({
  environmentId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every feature's `position` within an environment to match
 * `orderedIds`' order, 1-indexed, in one transaction; `orderedIds` must be
 * exactly the environment's current features — see `validateAndReorder` (TD-125).
 */
export default async function reorderDhEnvironmentFeatures(
  environmentId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireDm();

  const parsed = reorderSchema.safeParse({ environmentId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.dhEnvironmentFeature.findMany({
          where: { environmentId: parsed.data.environmentId },
          select: { id: true },
        })
      ).map((row) => row.id),
    buildPositionUpdate: (id, position) =>
      prisma.dhEnvironmentFeature.update({ where: { id }, data: { position } }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "environmentFeatureOrderMismatch",
  });

  if (result.ok) revalidateDashboard("environments");
  return result;
}
