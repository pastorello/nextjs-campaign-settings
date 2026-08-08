"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Deity from "../../definitions/interfaces/deities/Deity";

export default async function createDeity(
  formData: Deity
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Deity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    name,
    deityTitle,
    deityType,
    deityRank,
    tarotCard,
    celestialBody,
    element,
    class: deityClass,
    holidays,
    color,
    tradition,
    alignment,
    alignmentDomain,
    meaning,
  } = formData;

  await prisma.deities.create({
    data: {
      name,
      deityTitle,
      deityType,
      deityRank,
      tarotCard,
      celestialBody,
      element,
      class: deityClass,
      holidays,
      color,
      tradition,
      alignment,
      alignmentDomain,
      meaning,
    },
  });

  revalidatePath("/deities");
  return { ok: true };
}
