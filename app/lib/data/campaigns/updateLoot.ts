"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";

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
      message:
        "A loot row cannot link to both a magic item and a catalogue treasure.",
      path: ["treasureId"],
    }
  );
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Loot> & { id: number };

  await prisma.loot.update({
    where: { id },
    data,
  });

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
