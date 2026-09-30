"use server";

import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import { Prisma } from "@/generated/prisma/client";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

/**
 * Deletes a POI (TD-14 / SPEC-002).
 *
 * Unlike the four domains under `pagesConfig`, POI deletion is a Server
 * Action, not a route handler — there is no admin list page to fire a
 * `fetch(DELETE)` from, only `MapPOIPanel`'s own UI, which can call a
 * Server Action directly. Same auth guard, same "existence checked before
 * delete" shape as `deleteDeityById`, so a missing row is a 404-equivalent
 * `NotFoundError`, not conflated with a database outage (TD-13).
 *
 * NPCs and deities assigned to the landmark lose `poiId` and keep `zoneId`
 * (TD-147, the DM's decision of 2026-09-30): they fall back to the place
 * that enclosed the landmark, as a child place falls back to its
 * grandparent in `deletePlace`. ADR-0010's `zoneId = poi.zoneId` invariant
 * only binds while `poiId` is set, so clearing `poiId` alone keeps it. The
 * foreign keys stay `onDelete: Restrict` (SPEC-010 §6): the detach is done
 * here, in the same transaction as the delete, so a failure partway leaves
 * both the landmark and its entities as they were. A `P2025` from the delete
 * means another request got there first, reported like a missing row.
 */
export default async function deletePoi(id: number): Promise<void> {
  await requireSession();

  let existingItem;
  try {
    existingItem = await prisma.poi.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up poi for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("POI", id);
  }

  try {
    await prisma.$transaction([
      prisma.npc.updateMany({ where: { poiId: id }, data: { poiId: null } }),
      prisma.deities.updateMany({
        where: { poiId: id },
        data: { poiId: null },
      }),
      prisma.poi.delete({ where: { id } }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("POI", id);
    }
    throw toDatabaseError("deleting poi", error);
  }

  revalidateDashboard("geography");
}
