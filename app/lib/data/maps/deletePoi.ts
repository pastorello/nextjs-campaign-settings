"use server";

import { revalidatePath } from "next/cache";

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
    await prisma.poi.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting poi", error);
  }

  revalidatePath("/geography");
}
