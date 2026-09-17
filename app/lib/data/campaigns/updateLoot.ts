"use server";

import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates a loot row's own fields, including its position. Written from
 * `lootMeta`'s own field list, not "every key but `id`" — `Loot` also
 * carries `sceneId` and `taken`, neither of which this form edits (same
 * reasoning as `updateScene`). Re-enforces the magic-item/treasure mutual
 * exclusion `createLoot` already checks — an update can just as easily try
 * to link both.
 */
export default async function updateLoot(
  formData: Loot
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeUpdateSchema(lootMeta).refine(
    (data) => !(data.magicItemId != null && data.treasureId != null),
    {
      message: "lootLinksBoth" satisfies FieldErrorKey,
      path: ["treasureId"],
    }
  );
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Loot> & { id: number };

  try {
    await prisma.loot.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating loot", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
