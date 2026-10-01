"use server";

import { cookies } from "next/headers";
import z from "zod";

import { auth } from "@/auth";
import prisma from "@/app/lib/connections/prisma";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import { CAMPAIGN_COOKIE } from "./campaignCookie";

const selectCampaignSchema = z.object({
  campaignId: z.number().int().positive(),
});

/**
 * A player picks which of their campaigns they are viewing (SPEC-022 §9).
 * Not a DM action, so it checks the session, not the role. It writes only
 * a preference cookie, and only for a campaign the player is in, so it
 * cannot widen what anyone sees. Returns the campaign's system, for the
 * selector to navigate to.
 */
export default async function selectCampaign(
  input: z.input<typeof selectCampaignSchema>
): Promise<{ ok: true; system: GameSystem } | { ok: false }> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();

  const parsed = selectCampaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { campaignId } = parsed.data;

  let campaign;
  try {
    campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, members: { some: { id: session.user.id } } },
      select: { system: true },
    });
  } catch (error) {
    throw toDatabaseError("choosing a player's campaign", error);
  }
  if (!campaign || !isGameSystem(campaign.system)) return { ok: false };

  (await cookies()).set(CAMPAIGN_COOKIE, String(campaignId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true, system: campaign.system };
}
