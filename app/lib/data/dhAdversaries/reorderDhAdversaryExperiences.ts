"use server";

import { z } from "zod";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import validateAndReorder from "../campaigns/validateAndReorder";

const reorderSchema = z.object({
  adversaryId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every experience's `position` within an adversary to match
 * `orderedIds`' order, 1-indexed, in one transaction; `orderedIds` must be
 * exactly the adversary's current experiences — see `validateAndReorder` (TD-125).
 */
export default async function reorderDhAdversaryExperiences(
  adversaryId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireDm();

  const parsed = reorderSchema.safeParse({ adversaryId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const result = await validateAndReorder({
    findExistingIds: async () =>
      (
        await prisma.dhAdversaryExperience.findMany({
          where: { adversaryId: parsed.data.adversaryId },
          select: { id: true },
        })
      ).map((row) => row.id),
    buildPositionUpdate: (id, position) =>
      prisma.dhAdversaryExperience.update({
        where: { id },
        data: { position },
      }),
    orderedIds: parsed.data.orderedIds,
    mismatchMessage: "adversaryExperienceOrderMismatch",
  });

  if (result.ok) revalidateDashboard("adversaries");
  return result;
}
