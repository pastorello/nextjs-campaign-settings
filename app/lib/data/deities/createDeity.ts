"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Deity from "../../definitions/interfaces/deities/Deity";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createDeity(
  formData: Deity
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Deity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
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
  } = parsed.data as Omit<Deity, "id">;

  try {
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
  } catch (error) {
    throw toDatabaseError("creating deity", error);
  }

  revalidatePath("/deities");
  return { ok: true };
}
