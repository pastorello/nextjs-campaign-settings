"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { checkPointPlacement } from "./checkPlacement";

const inputSchema = z.object({
  id: z.coerce.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

/**
 * Draws a landmark that has no position onto its zone's map (TD-102) — the
 * landmark half of `placeZone` (which was `updateZonePosition`'s
 * `intent: "place"` branch until SPEC-017 T3 split it out).
 *
 * **Why this exists at all.** `fetchPlaceChildren` merges two tables into
 * one list, and `useUnplacedChildren` filters that list down to the rows
 * with no coordinates — so "Posiziona luogo"'s dropdown offers unplaced
 * landmarks (`poi` rows) alongside unplaced navigable places (`zone` rows).
 * Both carry an `id`, the two sequences are independent, and routing every
 * pick to the zone mutation therefore addressed whichever `zone` happened
 * to share the number: a different place entirely, or none.
 *
 * The caller branches on `kind === "poi"`, which is a sound discriminator
 * rather than a convention: `fetchPlaceChildren` hardcodes it for every
 * `poi` row, `placeSchema` restricts `zone.kind` to the navigable kinds, and
 * SPEC-008 T8's migration copied only navigable-kind rows into `zone`. No
 * `zone` row can carry it.
 *
 * **A placement, never a reposition** — hence no `intent` discriminator to
 * get wrong, unlike its zone counterpart. Dragging an already-placed
 * landmark goes through `usePOIManager` → `updatePoi`; this refuses a row
 * that already has coordinates outright. TD-93's reasoning, one mutation
 * narrower: the pre-state travels inside `updateMany`'s `where`, so
 * Postgres is what refuses a second placement, not a client snapshot the
 * dropdown may have read minutes ago.
 *
 * Unlike `updateZonePosition`'s refusal, this one does not tell the DM to
 * un-place the landmark first: there is no landmark equivalent of "Sposta
 * nei luoghi non posizionati" (SPEC-016 T5 covers navigable places only),
 * so naming that recovery path here would point at a control that does not
 * exist.
 */
export default async function placeLandmark(formData: {
  id: number;
  lat: number;
  lng: number;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = inputSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  let landmark: { zoneId: number } | null;
  try {
    landmark = await prisma.poi.findUnique({
      where: { id: data.id },
      select: { zoneId: true },
    });
  } catch (error) {
    throw toDatabaseError("placing landmark", error);
  }

  if (landmark === null) {
    return { ok: false, errors: { id: ["This landmark does not exist."] } };
  }

  // SPEC-009 §7 — a landmark, like any pin, may not land inside a sibling
  // area. `createPoi` runs this at creation; placing one that has since
  // lost its position (SPEC-010 T1) is the same act on an older row. No
  // `excludeZoneId`: that option leaves a *zone* out of its own sibling
  // set, and this row is a `poi`, never in that set to begin with.
  const errors = await checkPointPlacement({
    parentId: landmark.zoneId,
    point: [data.lat, data.lng],
  });
  if (errors) return { ok: false, errors };

  let count: number;
  try {
    ({ count } = await prisma.poi.updateMany({
      where: { id: data.id, lat: null },
      data: { lat: data.lat, lng: data.lng },
    }));
  } catch (error) {
    throw toDatabaseError("placing landmark", error);
  }

  if (count === 0) {
    return {
      ok: false,
      code: "alreadyPlaced",
      errors: { lat: ["This landmark is already positioned."] },
    };
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
