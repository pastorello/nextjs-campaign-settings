"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

const positionSchema = z.object({
  id: z.coerce.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

/**
 * Repositions a Zone (TD-71, SPEC-005 §5.B) — the only field this ever
 * writes is `lat`/`lng`, whether from dragging an already-placed navigable
 * marker (`useNavigableChildren`) or clicking to place a previously-
 * unplaced one (`WorldMap`'s positioning flow, SPEC-005 §5.A). Split from
 * `updatePoi` because SPEC-008 T8 split the table itself: a navigable place
 * lives in `zone` now, not `poi`.
 */
export default async function updateZonePosition(formData: {
  id: number;
  lat: number;
  lng: number;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = positionSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, lat, lng } = parsed.data;

  try {
    await prisma.zone.update({ where: { id }, data: { lat, lng } });
  } catch (error) {
    throw toDatabaseError("repositioning zone", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
