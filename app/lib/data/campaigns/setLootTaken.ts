"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const setLootTakenSchema = z.object({
  id: z.coerce.number().int().positive(),
  taken: z.boolean(),
});

/**
 * Sets a loot row's `taken` flag to an explicit state — idempotent by
 * construction, same reasoning as `setSceneAwarded`.
 */
export default async function setLootTaken(
  id: number,
  taken: boolean
): Promise<MutationResult> {
  await requireSession();

  const parsed = setLootTakenSchema.safeParse({ id, taken });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.loot.update({
      where: { id: parsed.data.id },
      data: { taken: parsed.data.taken },
    });
  } catch (error) {
    throw toDatabaseError("setting loot taken state", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
