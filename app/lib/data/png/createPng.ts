"use server";

import prisma from "@/app/lib/connections/prisma";
import { revalidatePath } from "next/cache";
import PngItem from "../../definitions/interfaces/png/PngItem";

export default async function createPng(formData: PngItem) {
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
}
