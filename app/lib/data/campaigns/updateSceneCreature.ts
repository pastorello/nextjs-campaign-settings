"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import sceneCreatureMeta from "@/app/lib/config/campaigns/sceneCreatureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import otherSystemFieldErrors from "./otherSystemFieldErrors";
import fetchRulesSystem from "./fetchRulesSystem";
import type { ChallengeRating } from "@/app/lib/config/dnd5e/challengeRatings";
import { blankToNull } from "@/app/lib/data/validation/featurePairErrors";

/**
 * Updates a creature row's own fields, including its position. Written
 * from `sceneCreatureMeta`'s own field list, not "every key but `id`" —
 * `SceneCreature` also carries `sceneId` and `awarded`, neither of which
 * this form edits (same reasoning as `updateScene`).
 */
export default async function updateSceneCreature(
  formData: SceneCreature
): Promise<MutationResult> {
  await requireDm();

  const parsed =
    buildBespokeUpdateSchema(sceneCreatureMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // SPEC-030: the campaign's system decides which fields exist.
  const system = await fetchRulesSystem({
    sceneCreatureId: parsed.data.id as number,
  });
  const systemErrors = otherSystemFieldErrors(
    "sceneCreature",
    system,
    parsed.data
  );
  if (systemErrors) return { ok: false, errors: systemErrors };

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<SceneCreature> & {
    id: number;
  };

  // A blank link or CR is stored as `null`, which the CHECKs admit; a key
  // the payload did not carry still leaves its column alone.
  if (data.statsUrl !== undefined) {
    data.statsUrl = blankToNull(data.statsUrl) ?? null;
  }
  if (data.challengeRating !== undefined) {
    // Validated against `CHALLENGE_RATINGS` above; blanking keeps it one.
    data.challengeRating = (blankToNull(data.challengeRating) ??
      null) as ChallengeRating | null;
  }

  try {
    await prisma.sceneCreature.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating scene creature", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
