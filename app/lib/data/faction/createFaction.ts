"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createFaction(
  formData: Faction
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Faction).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const { name, description } = parsed.data as Omit<Faction, "id">;

  // SPEC-020 T3 — an uploaded image must exist and belong to no other record.
  const { imageId } = parsed.data as { imageId?: number | null };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "faction",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.faction.create({
      data: {
        ...(imageId != null && { imageId }),
        name,
        description,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating faction", error);
  }

  revalidateDashboard("factions");
  return { ok: true };
}
