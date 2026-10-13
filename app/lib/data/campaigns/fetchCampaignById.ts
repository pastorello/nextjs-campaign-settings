import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";

export interface CampaignWithAdventures extends Campaign {
  adventures: Adventure[];
  /** The campaign's "today", a universal day; `null` = not set (SPEC-014 §5.5). */
  currentDay: number | null;
  /** When the campaign was archived; `null` = active (SPEC-032 §5.6). */
  archivedAt: Date | null;
}

/**
 * One campaign by id, with its adventures in ladder order — SPEC-013 §5's
 * "campaign page shows its adventures as an ordered ladder" — or `null`
 * when no campaign has that id (SPEC-032 §5.2: the page answers 404).
 *
 * Not filtered by the archive either (SPEC-032 §5.6): an archived campaign
 * stays reachable by its address, with `archivedAt` set for the banner.
 *
 * Not filtered by system: the page compares the campaign's own `system`
 * with the route's and redirects, so it has to be able to read a campaign
 * of another system to know where it lives.
 *
 * Outside the metadata layer (ADR-0011): a plain `select`-and-map read
 * rather than `getQuery`/`buildResultSchema`, which `campaign` and
 * `adventure` never register for.
 */
export default async function fetchCampaignById(
  id: number
): Promise<CampaignWithAdventures | null> {
  let row;
  try {
    row = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        synopsis: true,
        partySize: true,
        currentDay: true,
        archivedAt: true,
        system: true,
        adventures: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            campaignId: true,
            position: true,
            targetLevel: true,
            title: true,
            synopsis: true,
            status: true,
            xpTarget: true,
            currencyTarget: true,
            currencyUnit: true,
            permanentItemTarget: true,
            consumableTarget: true,
          },
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching the campaign", error);
  }

  if (!row) return null;
  // `system` is a raw `String` column (SPEC-018); `createCampaign` writes
  // only a validated `GameSystem`, so anything else is a corrupt row.
  if (!isGameSystem(row.system)) {
    throw toDatabaseError(
      "fetching the campaign",
      new Error(`Campaign ${row.id} has an unknown system "${row.system}".`)
    );
  }

  return {
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    partySize: row.partySize,
    currentDay: row.currentDay,
    archivedAt: row.archivedAt,
    system: row.system,
    // `status` is a raw `String` column (SPEC-013 §6); the three values
    // written to it are exactly `AdventureStatus`'s members, enforced at
    // write time by `adventureMeta.status`'s `z.nativeEnum` validator.
    adventures: row.adventures.map((adventure) => ({
      ...adventure,
      status: adventure.status as AdventureStatus,
    })),
  };
}
