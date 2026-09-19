"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import zoneMeta from "@/app/lib/config/geography/zoneMeta";
import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";

const zoneDetailsSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: zoneMeta.title.validator,
  description: zoneMeta.description.validator,
  imageId: zoneMeta.imageId.validator,
});

/**
 * Renames a place and rewrites its description (TD-104). Until this
 * existed, nothing in the application wrote `zone.title` or
 * `zone.description` after creation — `createPlace`, `createRootPlace`,
 * `updateZoneMap`, `updateZoneGrid`, `updateZonePosition`, `unplacePlace`
 * and `deletePlace` between them touch every other column, and a region was
 * therefore not renamable anywhere.
 *
 * A whole-form save, not a patch: `ZoneEditPanel` always sends both fields,
 * so an absent key is a malformed payload rather than "leave this one
 * alone". That is the opposite of `updatePoi`'s conditional-spread shape,
 * deliberately — a partial update needs a rule for what an omitted key
 * means, and this form has no way to express one.
 *
 * `description` arrives as `null` when the DM clears the box; the meta's
 * validator normalises that to `undefined` (`PageMeta`'s string branch
 * cannot carry `null`), and it is written back as `null` here so the
 * column ends up with one representation of "no description" rather than
 * an empty string beside it.
 *
 * `imageId` (SPEC-020 T3) is the one optional key: absent leaves the
 * picture alone, `null` removes it, an id attaches that upload. A replaced
 * or removed picture is deleted once the update has committed.
 *
 * Field validators come from `zoneMeta`, not restated here, so the panel
 * and the save cannot drift apart on what a legal title is — the same
 * arrangement `updateZoneGrid` has with `zoneGridMeta`.
 */
export default async function updateZoneDetails(formData: {
  id: number;
  title: string;
  description: string | null;
  imageId?: number | null;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = zoneDetailsSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { id, title, description, imageId } = parsed.data;

  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "zone",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  let previousImageId: number | null | undefined;
  try {
    if (imageId !== undefined) {
      previousImageId = (
        await prisma.zone.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.zone.update({
      where: { id },
      data: {
        title,
        description: description ?? null,
        ...(imageId !== undefined && { imageId }),
      },
    });
  } catch (error) {
    throw toDatabaseError("saving the place's details", error);
  }

  await releaseReplacedRecordImage(previousImageId, imageId);

  revalidateDashboard("geography");
  return { ok: true };
}
