"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Patrono from "../../definitions/interfaces/deities/Patrono";

export default async function createDeity(
  formData: Patrono
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Deity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

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
  return { ok: true };
}
