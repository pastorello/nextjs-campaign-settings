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
  // The zone whose map this is being placed on — the target, not the
  // landmark's current one (SPEC-017 T6). A landmark's `zoneId` is its tree
  // edge, exactly as `parentId` is a zone's, and a placement writes it.
  zoneId: z.coerce.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

/**
 * Thrown inside the transaction below to roll it back when the guarded
 * write finds nothing to place. Module-private and never surfaced: it is
 * control flow, not an error condition the caller can handle — the caller
 * gets `alreadyPlaced` like every other refused placement. Not one of
 * `app/lib/errors`' typed errors for that reason.
 */
class PlacementRefused extends Error {}

/**
 * Draws a landmark that has no position onto a zone's map (TD-102) — the
 * landmark half of `placeZone` (which was `updateZonePosition`'s
 * `intent: "place"` branch until SPEC-017 T3 split it out).
 *
 * **Why this exists at all.** `fetchPlaceChildren` merges two tables into
 * one list, and the picker filters that list down to the rows with no
 * coordinates — so "Posiziona luogo" offers unplaced landmarks (`poi` rows)
 * alongside unplaced navigable places (`zone` rows). Both carry an `id`,
 * the two sequences are independent, and routing every pick to the zone
 * mutation therefore addressed whichever `zone` happened to share the
 * number: a different place entirely, or none.
 *
 * The caller branches on `kind === "poi"`, which is a sound discriminator
 * rather than a convention: `fetchPlaceChildren` hardcodes it for every
 * `poi` row, `placeSchema` restricts `zone.kind` to the navigable kinds, and
 * SPEC-008 T8's migration copied only navigable-kind rows into `zone`.
 *
 * **It moves the landmark's tree edge, and its entities with it** (SPEC-017
 * T6, [ADR-0012](../../../../docs/adr/0012-placement-writes-the-tree-edge.md)).
 * `poi.zoneId` is written alongside the coordinates for the same reason
 * `placeZone` writes `parentId`: a `lat`/`lng` pair only means something
 * against one map image. The difference is what a landmark drags behind it
 * — ADR-0010's invariant says an entity with a `poiId` carries the `zoneId`
 * of that landmark's zone, so every `npc` and `deities` row pointing here
 * has to follow. **All three writes are one transaction**: a crash between
 * them would leave exactly the inconsistent row that invariant exists to
 * prevent, and Postgres cannot express the agreement as a constraint
 * without a trigger. `deletePlace` maintains the same agreement across
 * seven writes; these two are now the only places that do.
 *
 * The transaction is the interactive form — the first in this codebase,
 * which is why ADR-0012 records it rather than leaving it to be discovered
 * in a diff. The array form cannot express "and stop if the guard matched
 * nothing", and that guard is the whole of TD-93.
 *
 * **A placement, never a reposition**, hence no discriminator to get wrong,
 * unlike its zone counterpart before T3. Dragging an already-placed
 * landmark goes through `usePOIManager` → `updatePoi`; this refuses a row
 * that already has coordinates outright, with the pre-state inside
 * `updateMany`'s `where` so Postgres is what refuses a second placement,
 * not a client snapshot the picker may have read minutes ago.
 *
 * Unlike `placeZone`'s refusal, this one does not tell the DM to un-place
 * the landmark first: there is no landmark equivalent of "Sposta nei luoghi
 * non posizionati" until T10, so naming that recovery path here would point
 * at a control that does not exist.
 */
export default async function placeLandmark(formData: {
  id: number;
  zoneId: number;
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
  // area. Checked against the **target** zone since T6: the landmark is
  // landing among that map's places, not among the ones it is leaving. No
  // `excludeZoneId`: that option leaves a *zone* out of its own sibling
  // set, and this row is a `poi`, never in that set to begin with.
  //
  // No cycle check either, unlike `placeZone` (T5): a landmark cannot have
  // children — the schema gives it no `parentId` to have them with
  // (ADR-0010) — so there is no subtree it could be placed inside of.
  const errors = await checkPointPlacement({
    parentId: data.zoneId,
    point: [data.lat, data.lng],
  });
  if (errors) return { ok: false, errors };

  try {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.poi.updateMany({
        where: { id: data.id, lat: null },
        data: { lat: data.lat, lng: data.lng, zoneId: data.zoneId },
      });
      if (count === 0) throw new PlacementRefused();

      // ADR-0010: `poiId` set means `zoneId` is that landmark's zone. The
      // landmark just changed zones, so these follow it — `poiId` itself
      // is untouched, since the entity is still at the same landmark.
      await tx.npc.updateMany({
        where: { poiId: data.id },
        data: { zoneId: data.zoneId },
      });
      await tx.deities.updateMany({
        where: { poiId: data.id },
        data: { zoneId: data.zoneId },
      });
    });
  } catch (error) {
    if (error instanceof PlacementRefused) {
      return {
        ok: false,
        code: "alreadyPlaced",
        errors: { lat: ["This landmark is already positioned."] },
      };
    }
    throw toDatabaseError("placing landmark", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
