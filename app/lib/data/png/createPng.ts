"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import PngItem from "../../definitions/interfaces/png/PngItem";

export default async function createPng(
  formData: PngItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Png).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    nome,
    descrizione,
    titolo,
    allineamento,
    dominioallineamento,
    mansione,
    luogo,
    fazione,
    aspetto,
    personalita,
    motivazioni,
    segreti,
  } = formData;

  await prisma.png.create({
    data: {
      nome,
      descrizione,
      titolo,
      allineamento,
      dominioallineamento,
      mansione,
      luogo,
      fazione,
      aspetto,
      personalita,
      motivazioni,
      segreti,
    },
  });

  revalidatePath("/png");
  return { ok: true };
}
