"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import sceneCreatureMeta from "@/app/lib/config/campaigns/sceneCreatureMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Adds a creature to a scene (SPEC-013 §5). `sceneId` is deliberately not
 * part of `sceneCreatureMeta` — the caller supplies it directly from the
 * scene it is created on, the same split `createScene` uses for
 * `adventureId`.
 */
export default async function createSceneCreature(
  formData: SceneCreature
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeCreateSchema(sceneCreatureMeta).extend({
    sceneId: z.coerce.number().int().positive(),
  });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { sceneId, position, name, level, xpEach, quantity, note, npcId } =
    formData;

  await prisma.sceneCreature.create({
    data: { sceneId, position, name, level, xpEach, quantity, note, npcId },
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
