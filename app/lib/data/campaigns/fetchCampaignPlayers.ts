import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import type CampaignPlayers from "@/app/lib/definitions/interfaces/campaign/CampaignPlayers";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * A campaign's players and the player accounts that could join (SPEC-022
 * T5), for the campaign page. Guarded itself as well as by the page: it
 * returns email addresses.
 *
 * Only `player` accounts count. A member later promoted to DM keeps the
 * membership row, but is not listed: a DM sees everything regardless.
 */
export default async function fetchCampaignPlayers(
  campaignId: number
): Promise<CampaignPlayers> {
  await requireDm();

  let players;
  try {
    players = await prisma.users.findMany({
      where: { role: "player" },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        campaigns: { where: { id: campaignId }, select: { id: true } },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
  } catch (error) {
    throw toDatabaseError("reading a campaign's players", error);
  }

  const members: CampaignPlayers["members"] = [];
  const candidates: CampaignPlayers["candidates"] = [];
  for (const { campaigns, id, name, email, active } of players) {
    if (campaigns.length > 0) members.push({ id, name, email, active });
    else candidates.push({ id, name });
  }
  return { members, candidates };
}
