"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import LootMetaField from "@/app/lib/definitions/enums/campaign/LootMetaField";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";

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

  await prisma.loot.update({
    where: { id: formData.id },
    data: Object.values(LootMetaField).reduce(
      (acc, key) => ({ ...acc, [key]: formData[key] }),
      {} as Partial<Loot>
    ),
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
