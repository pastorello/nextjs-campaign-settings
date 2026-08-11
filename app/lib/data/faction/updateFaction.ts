"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Faction from "../../definitions/interfaces/faction/Faction";

export default async function updateFaction(
  formData: Faction
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Faction).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.faction.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as keyof Faction;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Faction),
  });

  revalidatePath("/factions");
  return { ok: true };
}
