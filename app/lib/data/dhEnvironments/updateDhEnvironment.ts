"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import checkDhEnvironmentLinks from "./checkDhEnvironmentLinks";

/**
 * Updates a Daggerheart environment (SPEC-028 T3). Its adversaries and
 * places are replaced as a set when the payload carries them, and left
 * alone when it does not.
 */
export default async function updateDhEnvironment(
  formData: DhEnvironment
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhEnvironment).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, environmentAdversaryIds, environmentPlaceIds, ...data } =
    parsed.data as Partial<
      Omit<DhEnvironment, "image" | "adversaries" | "places" | "features">
    > & { id: number };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhEnvironment",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };
  const linkErrors = await checkDhEnvironmentLinks(
    environmentAdversaryIds,
    environmentPlaceIds
  );
  if (linkErrors) return { ok: false, errors: linkErrors };

  // The image this save replaces or removes — deleted only once the update
  // has committed, so a failed save keeps the previous one (SPEC-020 §5).
  let previousImageId: number | null | undefined;
  try {
    if (data.imageId !== undefined) {
      previousImageId = (
        await prisma.dhEnvironment.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.dhEnvironment.update({
      where: { id },
      data: {
        ...data,
        ...(environmentAdversaryIds !== undefined && {
          adversaries: {
            deleteMany: {},
            create: [...new Set(environmentAdversaryIds)].map(
              (adversaryId) => ({ adversaryId })
            ),
          },
        }),
        ...(environmentPlaceIds !== undefined && {
          places: {
            set: environmentPlaceIds.map((placeId) => ({ id: placeId })),
          },
        }),
      },
    });
  } catch (error) {
    throw toDatabaseError("updating environment", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("environments");
  return { ok: true };
}
