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
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import Deity from "../../definitions/interfaces/deities/Deity";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createDeity(
  formData: Deity
): Promise<MutationResult> {
  await requireDm();

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

  // SPEC-020 T3 — an uploaded image must exist and belong to no other record.
  const { imageId } = parsed.data as { imageId?: number | null };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "deity",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  // SPEC-022 T6: the campaigns this record starts revealed to, which exist
  // and fit the catalogue's system.
  const { revealedTo: revealedTo } = parsed.data as { revealedTo?: number[] };
  const revealErrors = await checkRevealCampaigns(revealedTo, {
    field: "revealedTo",
  });
  if (revealErrors) return { ok: false, errors: revealErrors };

  try {
    await prisma.deities.create({
      data: {
        ...revealedToCreate(revealedTo),
        ...(imageId != null && { imageId }),
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

  revalidateDashboard("deities");
  return { ok: true };
}
