"use server";

import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import { z } from "zod";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Adds a loot row to a scene (SPEC-013 §5). `sceneId` is deliberately not
 * part of `lootMeta` — the caller supplies it directly, same split
 * `createScene` uses for `adventureId`.
 *
 * `magicItemId`/`treasureId` are each a plain nullable FK on `lootMeta`, but
 * mutually exclusive (§5's edge case: "rejected by the validator. At most
 * one link"); that cross-field rule cannot live in either field's own
 * validator, so it is a `.refine()` on the schema built here.
 */
export default async function createLoot(
  formData: Loot
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeCreateSchema(lootMeta)
    .extend({ sceneId: z.coerce.number().int().positive() })
    .refine((data) => !(data.magicItemId != null && data.treasureId != null), {
      message: "lootLinksBoth" satisfies FieldErrorKey,
      path: ["treasureId"],
    });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    sceneId,
    position,
    description,
    quantity,
    value,
    magicItemId,
    treasureId,
  } = parsed.data as Omit<Loot, "id">;

  try {
    await prisma.loot.create({
      data: {
        sceneId,
        position,
        description,
        quantity,
        value,
        magicItemId,
        treasureId,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating loot", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
