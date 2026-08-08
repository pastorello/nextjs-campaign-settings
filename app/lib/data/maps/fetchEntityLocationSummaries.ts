"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";
import type LocationSummary from "../../definitions/interfaces/maps/LocationSummary";

/**
 * Every NPC's or deity's current `zoneId`/`poiId`, plus a resolved display
 * title (SPEC-008 T5) — backs the admin list's assignment button, which
 * needs to show what's currently assigned before the modal even opens.
 */
export default async function fetchEntityLocationSummaries(
  linkedType: LinkableEntityType
): Promise<Map<number, LocationSummary>> {
  await requireSession();

  try {
    const rows =
      linkedType === "npc"
        ? await prisma.npc.findMany({
            select: {
              id: true,
              zoneId: true,
              poiId: true,
              zone: { select: { title: true } },
              poi: { select: { title: true } },
            },
          })
        : await prisma.deities.findMany({
            select: {
              id: true,
              zoneId: true,
              poiId: true,
              zone: { select: { title: true } },
              poi: { select: { title: true } },
            },
          });

    return new Map(
      rows.map((row) => [
        row.id,
        {
          zoneId: row.zoneId,
          poiId: row.poiId,
          title: row.poi?.title ?? row.zone?.title ?? null,
        },
      ])
    );
  } catch (error) {
    throw toDatabaseError("fetching entity location summaries", error);
  }
}
