"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type ZoneOption from "../../definitions/interfaces/maps/ZoneOption";

/**
 * Every Zone, alphabetically — the assignment modal's first step (SPEC-008
 * T4/§5). A flat list, not the tree itself: the modal only needs "pick one
 * of these," not the containment structure `fetchPlaceChildren` walks.
 */
export default async function fetchZones(): Promise<ZoneOption[]> {
  await requireDm();

  try {
    return await prisma.zone.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching zones", error);
  }
}
