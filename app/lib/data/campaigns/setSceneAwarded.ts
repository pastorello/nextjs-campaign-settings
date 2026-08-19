"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const setSceneAwardedSchema = z.object({
  id: z.coerce.number().int().positive(),
  awarded: z.boolean(),
});

/**
 * Sets a scene's `awarded` flag to an explicit state (SPEC-013 §5/§7's
 * check-off control). Idempotent by construction — the control always sends
 * the state it wants, never "flip whatever is there," so a rapid repeat
 * click resending the same value is a harmless no-op write, never a double
 * count (§5's edge case).
 */
export default async function setSceneAwarded(
  id: number,
  awarded: boolean
): Promise<MutationResult> {
  await requireSession();

  const parsed = setSceneAwardedSchema.safeParse({ id, awarded });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.scene.update({
      where: { id: parsed.data.id },
      data: { awarded: parsed.data.awarded },
    });
  } catch (error) {
    throw toDatabaseError("setting scene awarded state", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
