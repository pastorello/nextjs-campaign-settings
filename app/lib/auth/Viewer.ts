import type GameSystem from "@/app/lib/definitions/GameSystem";

export interface ViewerCampaign {
  id: number;
  title: string;
  system: GameSystem;
}

/**
 * Who is reading (SPEC-022 T7). A DM sees everything. A player sees what
 * their current campaign has been shown, and nothing at all with no
 * campaign.
 */
type Viewer =
  | { kind: "dm"; userId: string }
  | {
      kind: "player";
      userId: string;
      /** Every campaign the player is in, by title. */
      campaigns: ViewerCampaign[];
      /** The one they are viewing: the cookie's, else the first, else none. */
      campaign: ViewerCampaign | null;
    };

export default Viewer;
