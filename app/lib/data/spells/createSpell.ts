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
    nome,
    descrizione,
    livello,
    circolo,
    classi,
    tempodilancio,
    gittata,
    componenti,
    durata,
    tirosalvezza,
    rituale,
    concentrazione,
    intensificato,
  } = formData;

  await prisma.spells.create({
    data: {
      nome,
      descrizione,
      livello,
      circolo,
      classi,
      tempodilancio,
      gittata,
      componenti,
      durata,
      tirosalvezza,
      rituale,
      concentrazione,
      intensificato,
    },
  });

  revalidatePath("/spells");
  return { ok: true };
}
