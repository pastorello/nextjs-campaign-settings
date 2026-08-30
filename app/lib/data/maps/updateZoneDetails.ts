"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import zoneMeta from "@/app/lib/config/geography/zoneMeta";

const zoneDetailsSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: zoneMeta.title.validator,
  description: zoneMeta.description.validator,
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
 * Field validators come from `zoneMeta`, not restated here, so the panel
 * and the save cannot drift apart on what a legal title is — the same
 * arrangement `updateZoneGrid` has with `zoneGridMeta`.
 */
export default async function updateZoneDetails(formData: {
  id: number;
  title: string;
  description: string | null;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = zoneDetailsSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, title, description } = parsed.data;

  try {
    await prisma.zone.update({
      where: { id },
      data: { title, description: description ?? null },
    });
  } catch (error) {
    throw toDatabaseError("saving the place's details", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
