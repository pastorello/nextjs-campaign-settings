/**
 * A scene a campaign event may name (SPEC-014 §5.4, T6), with the adventure
 * it belongs to, so the event form can narrow the scenes to the chosen
 * adventure's.
 */
interface CampaignSceneOption {
  id: number;
  title: string;
  adventureId: number;
}

export default CampaignSceneOption;
