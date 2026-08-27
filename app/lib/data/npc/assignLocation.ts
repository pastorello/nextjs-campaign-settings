"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import type AssignLocationInput from "../../definitions/interfaces/maps/AssignLocationInput";
import { buildAssignLocationSchema } from "../validation/assignLocationSchema";
import resolveLocationAssignment from "../maps/resolveLocationAssignment";

/**
 * Assigns or clears an NPC's location (SPEC-008 T3) — the sole writer of
 * `npc.zoneId`/`poiId`. Bespoke, outside `buildEntitySchema`'s generic
 * update path: `location` is deliberately absent from `formFields` (§7),
 * since assignment happens through a dedicated modal, never `NpcForm`.
 *
 * Refuses to attach an NPC that already has a location (TD-93) — see the
 * guarded write below. `deities/assignLocation.ts` is this function's twin
 * and carries the same rule; change both or neither.
 */
export default async function assignNpcLocation(
  formData: AssignLocationInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildAssignLocationSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const resolved = await resolveLocationAssignment(
    parsed.data.zoneId,
    parsed.data.poiId
  );
  if (!resolved.ok) {
    return resolved;
  }

  // TD-93's invariant, enforced by the database rather than by a read
  // followed by a write: the pre-state travels inside `updateMany`'s
  // `where`, so Postgres is what refuses a second attachment and no
  // interleaved write can slip between a check and an update. Clearing is
  // exempt — it is the removal the refusal points the DM at, and
  // `deletePlace` reparents an attached entity the same way, which is why
  // this is a guarded write here and not a trigger on the table.
  const attaching = resolved.zoneId !== null || resolved.poiId !== null;

  if (!attaching) {
    try {
      await prisma.npc.update({
        where: { id: parsed.data.id },
        data: { zoneId: null, poiId: null },
      });
    } catch (error) {
      throw toDatabaseError("assigning npc location", error);
    }

    revalidatePath("/npc");
    return { ok: true };
  }

  let count: number;
  try {
    ({ count } = await prisma.npc.updateMany({
      where: { id: parsed.data.id, zoneId: null, poiId: null },
      data: { zoneId: resolved.zoneId, poiId: resolved.poiId },
    }));
  } catch (error) {
    throw toDatabaseError("assigning npc location", error);
  }

  if (count === 0) {
    // Nothing matched, which is either the refusal or a row that is not
    // there at all. One read, on the failure path only, so the message the
    // DM sees is true rather than merely the likelier of the two.
    let existing;
    try {
      existing = await prisma.npc.findUnique({
        where: { id: parsed.data.id },
        select: { id: true },
      });
    } catch (error) {
      throw toDatabaseError("assigning npc location", error);
    }

    return existing
      ? {
          ok: false,
          code: "alreadyPlaced",
          errors: {
            zoneId: [
              "This NPC is already at a location. Remove it from there first.",
            ],
          },
        }
      : { ok: false, errors: { id: ["This NPC does not exist."] } };
  }

  revalidatePath("/npc");
  return { ok: true };
}
