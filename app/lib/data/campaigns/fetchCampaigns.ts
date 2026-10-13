import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import GameSystem from "@/app/lib/definitions/GameSystem";

/** One card of the campaign list (SPEC-032 §5.1). */
export interface CampaignCard {
  id: number;
  title: string;
  synopsis: string | null;
  /** The number of players the campaign is planned for (`partySize`). */
  partySize: number;
  adventureCount: number;
}

/**
 * The route system's campaigns, oldest first, as the list's cards
 * (SPEC-032 §5.1) — empty on a system with none (§5.1's empty state).
 *
 * Filtered by `system` (ADR-0013 rule 9): switching system shows that
 * system's campaigns. Two campaigns may share a title; the title is not a
 * key (§8), so the order is by id.
 *
 * Outside the metadata layer (ADR-0011), like `fetchCampaignById`.
 */
export default async function fetchCampaigns(
  system: GameSystem
): Promise<CampaignCard[]> {
  let rows;
  try {
    rows = await prisma.campaign.findMany({
      where: { system },
      orderBy: { id: "asc" },
      select: {
        id: true,
        title: true,
        synopsis: true,
        partySize: true,
        _count: { select: { adventures: true } },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching the campaigns", error);
  }

  return rows.map(({ _count, ...campaign }) => ({
    ...campaign,
    adventureCount: _count.adventures,
  }));
}
