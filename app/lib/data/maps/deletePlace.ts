"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import ConflictError from "@/app/lib/errors/ConflictError";

/**
 * Deletes a place (SPEC-010 T2).
 *
 * Direct children — child zones and landmarks alike — move up to the
 * place's own parent and lose their position (rule 2, §5): they were
 * positioned on a map that no longer exists. Grandchildren are untouched,
 * since only `parentId`/`zoneId` equal to the deleted place's own id is
 * ever written.
 *
 * Entities are split by whether they reference the place directly or via
 * one of its landmarks (rule 3, §3). `poiId === null` means the place
 * itself was the assignment, so `zoneId` is cleared outright — guessing a
 * replacement would be inventing data. `poiId !== null` means the
 * assignment is a landmark, which moves up with the same transaction, so
 * `zoneId` follows it to the grandparent, keeping `poiId` and `zoneId` in
 * the agreement ADR-0010 requires — clearing `zoneId` while leaving
 * `poiId` in place would produce exactly the inconsistent row that
 * invariant exists to prevent.
 *
 * All seven writes run as one Prisma transaction, so a failure partway
 * leaves the tree exactly as it was (§8). A `P2025` from the final delete
 * means another request already deleted this row — "two deletes racing"
 * (§5) — reported as `NotFoundError`, the same as if it were missing from
 * the start, rather than surfaced as a generic database failure.
 *
 * The root — the one zone with no parent — is refused outright (rule 1),
 * which is also what guarantees every deletable place has a grandparent to
 * reparent into.
 */
export default async function deletePlace(id: number): Promise<void> {
  await requireSession();

  let place;
  try {
    place = await prisma.zone.findUnique({
      where: { id },
      select: { id: true, parentId: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up place for deletion", error);
  }

  if (!place) {
    throw new NotFoundError("Place", id);
  }

  if (place.parentId === null) {
    throw new ConflictError("The root place cannot be deleted.");
  }

  const grandparentId = place.parentId;

  try {
    await prisma.$transaction([
      prisma.zone.updateMany({
        where: { parentId: place.id },
        data: { parentId: grandparentId, lat: null, lng: null },
      }),
      prisma.poi.updateMany({
        where: { zoneId: place.id },
        data: { zoneId: grandparentId, lat: null, lng: null },
      }),
      prisma.npc.updateMany({
        where: { zoneId: place.id, poiId: null },
        data: { zoneId: null },
      }),
      prisma.deities.updateMany({
        where: { zoneId: place.id, poiId: null },
        data: { zoneId: null },
      }),
      prisma.npc.updateMany({
        where: { zoneId: place.id, poiId: { not: null } },
        data: { zoneId: grandparentId },
      }),
      prisma.deities.updateMany({
        where: { zoneId: place.id, poiId: { not: null } },
        data: { zoneId: grandparentId },
      }),
      prisma.zone.delete({ where: { id: place.id } }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Place", id);
    }
    throw toDatabaseError("deleting place", error);
  }

  revalidatePath("/dashboard/geography");
}
