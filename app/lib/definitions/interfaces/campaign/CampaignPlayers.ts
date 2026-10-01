/** A campaign's group, and who could join it (SPEC-022 T5). */
interface CampaignPlayers {
  /** The campaign's players, by name. */
  members: { id: string; name: string; email: string; active: boolean }[];
  /** Player accounts not yet in the group, by name. */
  candidates: { id: string; name: string }[];
}

export default CampaignPlayers;
