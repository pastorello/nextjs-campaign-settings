"use server";

import prisma from "@/app/lib/connections/prisma";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type DhCommunityLink from "@/app/lib/definitions/interfaces/daggerheart/DhCommunityLink";

/**
 * The communities rooted in a place (SPEC-027 §5.6), for its popover under
 * `daggerheart`. A player (SPEC-022) gets nothing for a place their campaign
 * cannot see; a community itself is a catalogue every reader sees.
 */
export default async function fetchCommunitiesAtPlace(
  zoneId: number
): Promise<DhCommunityLink[]> {
  const scope = await getVisibilityScope();
  if (!Number.isInteger(zoneId) || zoneId <= 0) return [];
  if (scope.kind === "campaign" && !scope.zones.has(zoneId)) return [];

  try {
    return await prisma.dhCommunity.findMany({
      where: { places: { some: { id: zoneId } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching a place's communities", error);
  }
}
