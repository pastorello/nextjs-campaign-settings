import prisma from "@/app/lib/connections/prisma";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";

/**
 * The systems of a player's campaigns, and the system of the one they are
 * viewing (SPEC-022 §8): the cookie's campaign if they are in it, else
 * their first, ordered as `getViewer` orders them. For the proxy, which
 * sends a player who lands on another system's overview to their own.
 * Null for a player in no campaign, who reads the rules of every system,
 * and when the database cannot be read: the layout's check still holds.
 */
export default async function playerSystems(
  userId: string,
  preferredCampaignId: number | null
): Promise<{ systems: ReadonlySet<GameSystem>; current: GameSystem } | null> {
  let rows;
  try {
    rows = await prisma.campaign.findMany({
      where: { members: { some: { id: userId } } },
      select: { id: true, system: true },
      orderBy: [{ title: "asc" }, { id: "asc" }],
    });
  } catch (error) {
    console.error("Reading a player's campaigns failed:", error);
    return null;
  }
  const campaigns = rows.flatMap(({ id, system }) =>
    isGameSystem(system) ? [{ id, system }] : []
  );
  const current =
    campaigns.find(({ id }) => id === preferredCampaignId) ?? campaigns[0];
  if (!current) return null;
  return {
    systems: new Set(campaigns.map(({ system }) => system)),
    current: current.system,
  };
}
