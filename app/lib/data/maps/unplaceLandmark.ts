"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

const inputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Sends a positioned landmark back to the unpositioned pool (SPEC-017 T10)
 * — the landmark half of `unplacePlace`, and the door SPEC-016 T5 built for
 * zones and not for landmarks.
 *
 * **Why it had to exist for the pool to work.** Until now a landmark could
 * only *enter* the pool as a side effect of deleting its zone (SPEC-010
 * rule 2 clears its position on the way up to the grandparent), so "move a
 * landmark from one map to another" was unreachable however good the picker
 * got: `placeLandmark` can move one, but nothing could put one in front of
 * it. This is why TD-102's refusal message had to stop short of naming a
 * recovery path — there was none to name. There is now.
 *
 * **`zoneId` stays**, and that is the decision rather than an omission
 * (ADR-0012 clause 2): an unplaced row keeps its edge as provenance — where
 * it came from, shown as the pool row's "da «X»" label — until a placement
 * overwrites it. `poi.zoneId` is `NOT NULL` besides, so there is no "in the
 * pool, belonging to nothing" state to write even if it were wanted.
 *
 * **No entity follow-through**, unlike `placeLandmark`. ADR-0010's
 * invariant is that an entity with a `poiId` carries that landmark's
 * *zone*, and un-placing does not change the zone — the landmark stays
 * exactly where it belongs, it just stops being drawn. Nothing to keep in
 * agreement, so no transaction: one statement is the whole write.
 *
 * A row that does not exist is reported as such rather than silently
 * succeeding: the count is the read, so no separate lookup and no window
 * between checking and writing. Un-placing something already unplaced is
 * not refused, matching `unplacePlace` — it is idempotent, and there is no
 * harm in it.
 */
export default async function unplaceLandmark(formData: {
  id: number;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = inputSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let count: number;
  try {
    ({ count } = await prisma.poi.updateMany({
      where: { id: parsed.data.id },
      data: { lat: null, lng: null },
    }));
  } catch (error) {
    throw toDatabaseError("un-placing landmark", error);
  }

  if (count === 0) {
    return { ok: false, errors: { id: ["This landmark does not exist."] } };
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
