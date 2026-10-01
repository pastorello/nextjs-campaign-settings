import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import type VisibilityScope from "./VisibilityScope";

/**
 * Whether an uploaded map may be served to the reader (SPEC-022 T7, R11):
 * always for the DM; for a player, only when a place that uses it is
 * visible to their campaign.
 */
export default async function isMapImageVisible(
  key: string,
  scope: VisibilityScope
): Promise<boolean> {
  if (scope.kind === "all") return true;

  let zones;
  try {
    zones = await prisma.zone.findMany({
      where: { mapImage: key },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("checking who may see a map", error);
  }
  return zones.some(({ id }) => scope.zones.has(id));
}
