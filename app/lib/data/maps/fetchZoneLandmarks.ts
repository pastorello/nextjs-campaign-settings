"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type ZoneOption from "../../definitions/interfaces/maps/ZoneOption";

/**
 * Every landmark POI inside a given Zone, alphabetically — the assignment
 * modal's optional second step (SPEC-008 T4/§5). Reads the landmark-only
 * `poi` shape T8 introduced (`zoneId`, no `kind`/`parentId`).
 */
export default async function fetchZoneLandmarks(
  zoneId: number
): Promise<ZoneOption[]> {
  await requireSession();

  try {
    return await prisma.poi.findMany({
      where: { zoneId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching zone landmarks", error);
  }
}
