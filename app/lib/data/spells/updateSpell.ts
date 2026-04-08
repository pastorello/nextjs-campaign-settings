"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/connections/prisma";

import Spell from "../../definitions/interfaces/spells/Spell";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";

export default async function updateSpell(formData: Spell) {
  await prisma.spells.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as SpellMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Spell),
  });

  revalidatePath("/spells");
}
