import { cookies } from "next/headers";
import { cache } from "react";

import { auth } from "@/auth";
import prisma from "@/app/lib/connections/prisma";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import { CAMPAIGN_COOKIE } from "./campaignCookie";
import type Viewer from "./Viewer";

/**
 * The reader of this request (SPEC-022 T7), or null without a session.
 * Read paths that a player may reach ask this, never the session's role
 * alone: a player's view is one campaign, picked here. The campaign cookie
 * is only a preference. A campaign the player has left falls back to their
 * first, never to "everything". Cached per request.
 */
const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;
  if (session.user.role === "dm") return { kind: "dm", userId };

  let rows;
  try {
    rows = await prisma.campaign.findMany({
      where: { members: { some: { id: userId } } },
      select: { id: true, title: true, system: true },
      orderBy: [{ title: "asc" }, { id: "asc" }],
    });
  } catch (error) {
    throw toDatabaseError("reading a player's campaigns", error);
  }
  const campaigns = rows.flatMap(({ id, title, system }) =>
    isGameSystem(system) ? [{ id, title, system }] : []
  );

  const preferred = Number((await cookies()).get(CAMPAIGN_COOKIE)?.value);
  const campaign =
    campaigns.find(({ id }) => id === preferred) ?? campaigns[0] ?? null;

  return { kind: "player", userId, campaigns, campaign };
});

export default getViewer;
