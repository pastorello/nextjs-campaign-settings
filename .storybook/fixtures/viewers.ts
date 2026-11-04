import type Viewer from "@/app/lib/auth/Viewer";
import type { ViewerCampaign } from "@/app/lib/auth/Viewer";

/** Who is signed in (SPEC-022): the DM, or a player and their campaigns. */
export const campaigns: ViewerCampaign[] = [
  { id: 1, title: "La caduta di Kang", system: "dnd5e" },
  { id: 2, title: "Le Lanterne di Skreebar", system: "daggerheart" },
];

export const dm: Viewer = { kind: "dm", userId: "dm-1" };

export const player: Viewer = {
  kind: "player",
  userId: "player-1",
  campaigns,
  campaign: campaigns[0] ?? null,
};

export const playerInOneCampaign: Viewer = {
  kind: "player",
  userId: "player-2",
  campaigns: campaigns.slice(0, 1),
  campaign: campaigns[0] ?? null,
};
