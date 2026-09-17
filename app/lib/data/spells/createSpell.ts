"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { revalidatePath } from "next/cache";
import Spell from "../../definitions/interfaces/spells/Spell";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createSpell(
  formData: Spell
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Spell).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    name,
    description,
    level,
    circle,
    classes,
    castingTime,
    range,
    components,
    duration,
    savingThrow,
    ritual,
    concentration,
    upcast,
  } = parsed.data as Omit<Spell, "id">;

  try {
    await prisma.spells.create({
      data: {
        name,
        description,
        level,
        circle,
        classes,
        castingTime,
        range,
        components,
        duration,
        savingThrow,
        ritual,
        concentration,
        upcast,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating spell", error);
  }

  revalidatePath("/spells");
  return { ok: true };
}
