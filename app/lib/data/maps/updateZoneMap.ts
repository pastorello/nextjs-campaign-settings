"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

const zoneMapSchema = z.object({
  id: z.coerce.number().int().positive(),
  mapImage: z.string().min(1),
});

/**
 * Gives an existing place a map, or replaces the one it has (SPEC-007 T1) —
 * the gap `createRootPlace`/`createPlace` left: a map could be set at
 * creation and never again. Only ever writes `mapImage`. `mapBounds`,
 * `mapInitialView` and `mapInitialZoom` are untouched (re-cropping is out of
 * scope, SPEC-007 §3), and so are any children's own `lat`/`lng` — those are
 * stored against the child row, not against the parent's image, which is
 * exactly why replacing the image here cannot itself move them (SPEC-007
 * §5's misalignment warning lives in the caller, not in this guarantee).
 */
export default async function updateZoneMap(formData: {
  id: number;
  mapImage: string;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = zoneMapSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, mapImage } = parsed.data;

  try {
    await prisma.zone.update({ where: { id }, data: { mapImage } });
  } catch (error) {
    throw toDatabaseError("setting the place's map", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
