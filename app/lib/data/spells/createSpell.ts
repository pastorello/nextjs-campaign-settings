"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { revalidatePath } from "next/cache";
import Spell from "../../definitions/interfaces/spells/Spell";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";

export default async function createSpell(
  formData: Spell
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Spell).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    name,
    description,
    level,
    circle,
    classes,
    castingTime,
    range,
    components,
    duration,
    savingThrow,
    ritual,
    concentration,
    upcast,
  } = formData;

  await prisma.spells.create({
    data: {
      name,
      description,
      level,
      circle,
      classes,
      castingTime,
      range,
      components,
      duration,
      savingThrow,
      ritual,
      concentration,
      upcast,
    },
  });

  revalidatePath("/spells");
  return { ok: true };
}
