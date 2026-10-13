import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import GameSystem from "@/app/lib/definitions/GameSystem";

/** One entry of the list's archived section (SPEC-032 §5.1, §5.6). */
export interface ArchivedCampaign {
  id: number;
  title: string;
  archivedAt: Date;
}

/**
 * The route system's archived campaigns, most recently archived first —
 * the list's collapsed section, each with its "Riattiva" action. The cards
 * are `fetchCampaigns`.
 */
export default async function fetchArchivedCampaigns(
  system: GameSystem
): Promise<ArchivedCampaign[]> {
  let rows;
  try {
    rows = await prisma.campaign.findMany({
      where: { system, archivedAt: { not: null } },
      orderBy: [{ archivedAt: "desc" }, { id: "asc" }],
      select: { id: true, title: true, archivedAt: true },
    });
  } catch (error) {
    throw toDatabaseError("fetching the archived campaigns", error);
  }

  return rows.flatMap(({ id, title, archivedAt }) =>
    archivedAt ? [{ id, title, archivedAt }] : []
  );
}
