"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const setSceneCreatureAwardedSchema = z.object({
  id: z.coerce.number().int().positive(),
  awarded: z.boolean(),
});

/**
 * Sets a creature row's `awarded` flag to an explicit state — idempotent by
 * construction, same reasoning as `setSceneAwarded`.
 */
export default async function setSceneCreatureAwarded(
  id: number,
  awarded: boolean
): Promise<MutationResult> {
  await requireSession();

  const parsed = setSceneCreatureAwardedSchema.safeParse({ id, awarded });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.sceneCreature.update({
      where: { id: parsed.data.id },
      data: { awarded: parsed.data.awarded },
    });
  } catch (error) {
    throw toDatabaseError("setting scene creature awarded state", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
