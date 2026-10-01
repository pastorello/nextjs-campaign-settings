"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import checkDhCommunityLinks from "./checkDhCommunityLinks";

/**
 * Updates a Daggerheart community (SPEC-027 T3). Its places and factions are
 * replaced as a set when the payload carries them, and left alone when it
 * does not.
 */
export default async function updateDhCommunity(
  formData: DhCommunity
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhCommunity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, communityPlaceIds, communityFactionIds, ...data } =
    parsed.data as Partial<
      Omit<DhCommunity, "image" | "places" | "factions">
    > & { id: number };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhCommunity",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };
  const linkErrors = await checkDhCommunityLinks(
    communityPlaceIds,
    communityFactionIds
  );
  if (linkErrors) return { ok: false, errors: linkErrors };

  // The image this save replaces or removes — deleted only once the update
  // has committed, so a failed save keeps the previous one (SPEC-020 §5).
  let previousImageId: number | null | undefined;
  try {
    if (data.imageId !== undefined) {
      previousImageId = (
        await prisma.dhCommunity.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.dhCommunity.update({
      where: { id },
      data: {
        ...data,
        ...(communityPlaceIds !== undefined && {
          places: {
            set: communityPlaceIds.map((placeId) => ({ id: placeId })),
          },
        }),
        ...(communityFactionIds !== undefined && {
          factions: {
            set: communityFactionIds.map((factionId) => ({ id: factionId })),
          },
        }),
      },
    });
  } catch (error) {
    throw toDatabaseError("updating community", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("communities");
  return { ok: true };
}
