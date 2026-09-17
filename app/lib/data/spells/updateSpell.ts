"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";

import Spell from "../../definitions/interfaces/spells/Spell";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function updateSpell(
  formData: Spell
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Spell).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Spell> & { id: number };

  try {
    await prisma.spells.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating spell", error);
  }

  revalidatePath("/spells");
  return { ok: true };
}
