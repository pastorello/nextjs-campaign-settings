import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

export interface CampaignWithAdventures extends Campaign {
  adventures: Adventure[];
}

/**
 * The DM's campaign, with its adventures in ladder order — SPEC-013 §5's
 * "campaign page shows its adventures as an ordered ladder" — or `null` on
 * an empty install nothing has created yet (§5's empty-state edge case).
 *
 * Single-record read, `findFirst` rather than a list: the schema does not
 * forbid a second `campaign` row, but the product only ever shows the
 * first — a second campaign is multi-campaign support (ROADMAP.md), a
 * different piece of work, not this spec's. Same reasoning `fetchRootPlace`
 * already uses for the map's single root.
 *
 * Outside the metadata layer (ADR-0011): a plain `select`-and-map read
 * rather than `getQuery`/`buildResultSchema`, which `campaign` and
 * `adventure` never register for.
 */
export default async function fetchCampaign(): Promise<CampaignWithAdventures | null> {
  let row;
  try {
    row = await prisma.campaign.findFirst({
      orderBy: { id: "asc" },
      select: {
        id: true,
        title: true,
        synopsis: true,
        partySize: true,
        adventures: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            campaignId: true,
            position: true,
            targetLevel: true,
            title: true,
            synopsis: true,
            timeline: true,
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

  return {
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    partySize: row.partySize,
    // `status` is a raw `String` column (SPEC-013 §6); the three values
    // written to it are exactly `AdventureStatus`'s members, enforced at
    // write time by `adventureMeta.status`'s `z.nativeEnum` validator.
    adventures: row.adventures.map((adventure) => ({
      ...adventure,
      status: adventure.status as AdventureStatus,
    })),
  };
}
