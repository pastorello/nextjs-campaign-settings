/**
 * A campaign event's owner fields the DM chooses in its form (SPEC-014
 * §5.4, T6). `campaignId` is absent: the page supplies it, the way
 * `createScene`'s caller supplies `adventureId`.
 */
enum CampaignEventOwnerField {
  adventureId = "adventureId",
  sceneId = "sceneId",
}

export default CampaignEventOwnerField;
