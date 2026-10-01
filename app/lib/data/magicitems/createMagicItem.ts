"use server";

import checkRevealCampaigns from "@/app/lib/data/visibility/checkRevealCampaigns";
import { revealedToCreate } from "@/app/lib/data/visibility/revealedToWrite";
import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createMagicItem(
  formData: MagicItem
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.MagicItem).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const { name, description, type, rarity, attuned, consumable } =
    parsed.data as Omit<MagicItem, "id">;

  // SPEC-020 T3 — an uploaded image must exist and belong to no other record.
  const { imageId } = parsed.data as { imageId?: number | null };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "magicItem",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  // SPEC-022 T6: the campaigns this record starts revealed to, which exist
  // and fit the catalogue's system.
  const { revealedToDnd5e: revealedTo } = parsed.data as {
    revealedToDnd5e?: number[];
  };
  const revealErrors = await checkRevealCampaigns(revealedTo, {
    field: "revealedToDnd5e",
    system: "dnd5e",
  });
  if (revealErrors) return { ok: false, errors: revealErrors };

  try {
    await prisma.magicitems.create({
      data: {
        ...revealedToCreate(revealedTo),
        ...(imageId != null && { imageId }),
        name,
        description,
        type,
        rarity,
        attuned,
        consumable,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating magic item", error);
  }

  revalidateDashboard("magicitems");
  return { ok: true };
}
