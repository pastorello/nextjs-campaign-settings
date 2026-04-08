"use server";

import prisma from "@/app/lib/connections/prisma";
import { revalidatePath } from "next/cache";
import Spell from "../../definitions/interfaces/spells/Spell";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";

export default async function createSpell(formData: Spell) {
  const {
    nome,
    descrizione,
    livello,
    circolo,
    classi,
    sottoclassi,
    tempodilancio,
    gittata,
    componenti,
    durata,
    tirosalvezza,
    rituale,
    concentrazione,
    intensificato,
  } = formData;
  SpellMetaField;

  await prisma.spells.create({
    data: {
      nome,
      descrizione,
      livello,
      circolo,
      classi,
      sottoclassi,
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
}
