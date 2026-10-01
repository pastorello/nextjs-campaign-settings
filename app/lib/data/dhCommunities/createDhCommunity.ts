"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import checkDhCommunityLinks from "./checkDhCommunityLinks";

/**
 * Creates a Daggerheart community (SPEC-027 T3) with its places and
 * factions, each of which must exist.
 */
export default async function createDhCommunity(
  formData: DhCommunity
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhCommunity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, communityPlaceIds, communityFactionIds, ...fields } =
    parsed.data as Omit<
      DhCommunity,
      | "id"
      | "image"
      | "places"
      | "factions"
      | "communityPlaceIds"
      | "communityFactionIds"
    > & {
      communityPlaceIds?: number[];
      communityFactionIds?: number[];
    };

  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhCommunity",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };
  const linkErrors = await checkDhCommunityLinks(
    communityPlaceIds,
    communityFactionIds
  );
  if (linkErrors) return { ok: false, errors: linkErrors };

  try {
    await prisma.dhCommunity.create({
      data: {
        ...(imageId != null && { imageId }),
        ...fields,
        places: { connect: (communityPlaceIds ?? []).map((id) => ({ id })) },
        factions: {
          connect: (communityFactionIds ?? []).map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("creating community", error);
  }

  revalidateDashboard("communities");
  return { ok: true };
}
