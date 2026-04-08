"use server";

import prisma from "@/app/lib/connections/prisma";
import { revalidatePath } from "next/cache";
import Patrono from "../../definitions/interfaces/deities/Patrono";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";

export default async function createDeity(formData: Patrono) {
  const {
    nome,
    titolopatrono,
    tipopatrono,
    gradopatrono,
    card,
    astri,
    elemento,
    classe,
    festivita,
    colore,
    tradizione,
    allineamento,
    dominioallineamento,
    residenza,
    luogo,
    significato,
  } = formData;
  PatronoMetaField;

  await prisma.deities.create({
    data: {
      nome,
      titolopatrono,
      tipopatrono,
      gradopatrono,
      card,
      astri,
      elemento,
      classe,
      festivita,
      colore,
      tradizione,
      allineamento,
      dominioallineamento,
      residenza,
      luogo,
      significato,
    },
  });

  revalidatePath("/deities");
}
