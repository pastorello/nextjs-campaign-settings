"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function createMagicItem(formData: MagicItem) {
  await requireSession();

  const { nome, descrizione, tipo, rarita, sintonia } = formData;

  await prisma.magicitems.create({
    data: {
      nome,
      descrizione,
      tipo,
      rarita,
      sintonia,
    },
  });

  revalidatePath("/magicitems");
}
