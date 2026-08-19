"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
      message:
        "A loot row cannot link to both a magic item and a catalogue treasure.",
      path: ["treasureId"],
    });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    sceneId,
    position,
    description,
    quantity,
    value,
    magicItemId,
    treasureId,
  } = formData;

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

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
