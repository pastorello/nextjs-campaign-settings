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
  // The map being placed onto — the target parent, not the place's current
  // one. Required, not optional-with-a-fallback: a placement that could
  // silently keep the old edge is the bug SPEC-017 exists to fix.
  parentId: z.coerce.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

/**
 * Draws a navigable place that has no position onto a map (SPEC-017 T3) —
 * the zone half of what `placeLandmark` does for a landmark, and the exact
 * behaviour that used to live inside `updateZonePosition` as its
 * `intent: "place"` branch.
 *
 * **Why it is its own mutation now.** TD-93 made `intent` a required
 * discriminator because the two acts this write serves — placing something
 * that is nowhere, and moving something that is already on the map — are
 * the same `UPDATE` to Postgres but not the same thing to the DM, and a
 * default would let the next caller inherit whichever one it did not mean.
 * Two functions are the stronger form of that argument: calling the wrong
 * one is no longer an argument to remember but a function that is not in
 * scope. It also gives placement somewhere to grow — SPEC-017 T4 adds the
 * target parent here, and only here, so a drag can never re-parent
 * anything.
 *
 * **It writes the tree edge, and that is the point** (SPEC-017 T4,
 * [ADR-0012](../../../../docs/adr/0012-placement-writes-the-tree-edge.md)).
 * `parentId` travels in the same `updateMany` as the coordinates because
 * the two are one fact: a `lat`/`lng` pair is a position inside one map
 * image, measured against that parent's `mapBounds`, and means a different
 * spot — or nothing at all — on any other map. Writing one without the
 * other produces a row that is internally coherent and factually nonsense.
 * This is what makes moving a place between maps possible: the DM opens the
 * target map, picks a pooled place, and the edge follows the pin.
 *
 * **A placement, never a reposition**, hence no discriminator to get wrong.
 * The pre-state travels inside `updateMany`'s `where`, so Postgres is what
 * refuses a second placement rather than `useUnplacedPlaces`' client
 * snapshot, which may have been read minutes ago. "Unpositioned" means
 * `lat === null`, the same definition `countUnpositionedPlaces` and
 * `fetchUnplacedPlaces` use.
 *
 * SPEC-009 §7's point check runs first, and against the **target's**
 * siblings — the place is landing among them, not among the ones it is
 * leaving. `excludeZoneId` keeps the row out of its own sibling set, which
 * matters when the target parent is also its current one (the ordinary
 * case, and every case until T8 widens the pool).
 *
 * The root is refused outright. It is the one zone with no parent
 * (SPEC-009 §6) and nothing lists it as placeable — `fetchUnplacedPlaces`
 * and `countUnpositionedPlaces` both exclude it — but the guard belongs
 * here rather than in the caller, for TD-93's reason: the list is a client
 * snapshot and this is where the rule is real. T5's descendant check will
 * subsume it (every zone is a descendant of the root, so every target is);
 * the explicit refusal stays because it names the reason.
 */
export default async function placeZone(formData: {
  id: number;
  parentId: number;
  lat: number;
  lng: number;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = inputSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  let zone: { parentId: number | null } | null;
  try {
    zone = await prisma.zone.findUnique({
      where: { id: data.id },
      select: { parentId: true },
    });
  } catch (error) {
    throw toDatabaseError("placing zone", error);
  }

  // Checked before the placement rather than after, unlike the branch this
  // was extracted from — same outcome, since a row that does not exist has
  // no parent and skipped the sibling check anyway, and this way the read
  // and the thing it proves sit next to each other.
  if (zone === null) {
    return { ok: false, errors: { id: ["This place does not exist."] } };
  }

  if (zone.parentId === null) {
    return {
      ok: false,
      errors: { id: ["The root place cannot be placed on a map."] },
    };
  }

  const errors = await checkPointPlacement({
    parentId: data.parentId,
    point: [data.lat, data.lng],
    excludeZoneId: data.id,
  });
  if (errors) return { ok: false, errors };

  let count: number;
  try {
    ({ count } = await prisma.zone.updateMany({
      where: { id: data.id, lat: null },
      data: { lat: data.lat, lng: data.lng, parentId: data.parentId },
    }));
  } catch (error) {
    throw toDatabaseError("placing zone", error);
  }

  if (count === 0) {
    return {
      ok: false,
      code: "alreadyPlaced",
      errors: {
        lat: [
          "This place is already positioned. Move it back to the unpositioned places first.",
        ],
      },
    };
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
