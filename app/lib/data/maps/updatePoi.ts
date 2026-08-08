"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { buildPoiUpdateSchema } from "../validation/poiSchema";
import type { PoiUpdateInput } from "../../definitions/interfaces/maps/Poi";

/**
 * Updates a POI (TD-14 / SPEC-002, reshaped by SPEC-008 T8). Each field is
 * spread into `data` only when the parsed payload actually carries it: an
 * omitted key leaves the column untouched.
 *
 * Built field-by-field rather than `data: rest` for the same reason as
 * `createPoi`: under `exactOptionalPropertyTypes`, Zod's `.partial()`
 * infers every field as `T | undefined`, which does not structurally match
 * Prisma's update input types (`string | StringFieldUpdateOperationsInput`,
 * no bare `undefined`). Spreading `key !== undefined && { key }` keeps an
 * unset field out of the object entirely instead of present-and-`undefined`.
 */
export default async function updatePoi(
  formData: PoiUpdateInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildPoiUpdateSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, title, description, lat, lng, category, zoneId } = parsed.data;

  try {
    await prisma.poi.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(category !== undefined && { category }),
        ...(zoneId !== undefined && { zoneId }),
      },
    });
  } catch (error) {
    throw toDatabaseError("updating poi", error);
  }

  revalidatePath("/geography");
  return { ok: true };
}
