"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import toStoredSpellcastTrait from "./toStoredSpellcastTrait";

/**
 * Creates a subclass (SPEC-021 §5.5). Its tiered features are added inline
 * afterwards, from the edit dialog (ADR-0011) — unlike a class, a subclass
 * may have none.
 */
export default async function createDhSubclass(
  formData: DhSubclass
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.DhSubclass).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data` (TD-122); this assertion narrows the built
  // schema's widened output back.
  const { name, description, classId, spellcastTrait, origin } =
    parsed.data as Omit<DhSubclass, "id" | "classId"> & { classId: number };

  try {
    await prisma.dhSubclass.create({
      data: {
        name,
        description,
        classId,
        spellcastTrait: toStoredSpellcastTrait(spellcastTrait),
        origin,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating subclass", error);
  }

  revalidateDashboard("admin/subclasses");
  return { ok: true };
}
