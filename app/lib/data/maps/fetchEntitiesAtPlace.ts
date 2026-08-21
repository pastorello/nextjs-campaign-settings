"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type EntityAtPlace from "@/app/lib/definitions/interfaces/maps/EntityAtPlace";

/**
 * The entities shown in a place's popover (SPEC-016 T1, §5) — NPCs and
 * deities attached directly to a zone, or to one of its landmarks.
 * "Direct" mirrors `fetchPlaceDeletionImpact`'s own `poiId: null` filter
 * for the zone case: an entity reached via a landmark shows in that
 * landmark's own popover, not its zone's (§5, "a zone's popover lists only
 * its direct attachments; each landmark's popover lists its own" — agreed
 * with the DM 2026-08-21).
 */
export default async function fetchEntitiesAtPlace(
  target: { zoneId: number } | { poiId: number }
): Promise<EntityAtPlace[]> {
  await requireSession();

  const where =
    "zoneId" in target
      ? { zoneId: target.zoneId, poiId: null }
      : { poiId: target.poiId };

  try {
    const [npcs, deities] = await Promise.all([
      prisma.npc.findMany({
        where,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.deities.findMany({
        where,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return [
      ...npcs.map((npc) => ({ ...npc, type: "npc" as const })),
      ...deities.map((deity) => ({ ...deity, type: "deity" as const })),
    ];
  } catch (error) {
    throw toDatabaseError("fetching entities at place", error);
  }
}
