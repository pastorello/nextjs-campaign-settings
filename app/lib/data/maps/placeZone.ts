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
 * **A placement, never a reposition**, hence no discriminator to get wrong.
 * The pre-state travels inside `updateMany`'s `where`, so Postgres is what
 * refuses a second placement rather than `useUnplacedPlaces`' client
 * snapshot, which may have been read minutes ago. "Unpositioned" means
 * `lat === null`, the same definition `countUnpositionedPlaces` and
 * `fetchUnplacedPlaces` use.
 *
 * SPEC-009 §7's point check runs first, against the place's siblings, with
 * `excludeZoneId` so the row does not collide with itself.
 */
export default async function placeZone(formData: {
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

  if (zone.parentId != null) {
    const errors = await checkPointPlacement({
      parentId: zone.parentId,
      point: [data.lat, data.lng],
      excludeZoneId: data.id,
    });
    if (errors) return { ok: false, errors };
  }

  let count: number;
  try {
    ({ count } = await prisma.zone.updateMany({
      where: { id: data.id, lat: null },
      data: { lat: data.lat, lng: data.lng },
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
