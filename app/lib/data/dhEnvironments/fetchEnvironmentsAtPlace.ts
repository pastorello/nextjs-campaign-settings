"use server";

import prisma from "@/app/lib/connections/prisma";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * The environments that describe a place (SPEC-028 §5.5), for its popover
 * under `daggerheart`. The DM's alone (§9 decision 3): a player gets none.
 */
export default async function fetchEnvironmentsAtPlace(
  zoneId: number
): Promise<{ id: number; name: string }[]> {
  const scope = await getVisibilityScope();
  if (scope.kind === "campaign") return [];
  if (!Number.isInteger(zoneId) || zoneId <= 0) return [];

  try {
    return await prisma.dhEnvironment.findMany({
      where: { places: { some: { id: zoneId } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching a place's environments", error);
  }
}
