"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";

import Spell from "../../definitions/interfaces/spells/Spell";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";

export default async function updateSpell(
  formData: Spell
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Spell).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

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
  return { ok: true };
}
