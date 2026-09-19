"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import toStoredSpellcastTrait from "./toStoredSpellcastTrait";

/** Updates a subclass's own fields; its features have their own actions. */
export default async function updateDhSubclass(
  formData: DhSubclass
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.DhSubclass).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data` (TD-122): only the declared keys the payload
  // carried, already coerced.
  const { id, spellcastTrait, ...data } = parsed.data as Partial<
    Omit<DhSubclass, "features" | "classId">
  > & { id: number; classId?: number };

  try {
    await prisma.dhSubclass.update({
      where: { id },
      data: {
        ...data,
        ...(spellcastTrait !== undefined && {
          spellcastTrait: toStoredSpellcastTrait(spellcastTrait),
        }),
      },
    });
  } catch (error) {
    throw toDatabaseError("updating subclass", error);
  }

  revalidateDashboard("admin/subclasses");
  return { ok: true };
}
