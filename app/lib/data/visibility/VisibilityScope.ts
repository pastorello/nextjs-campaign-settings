/**
 * What a read may return (SPEC-022 T7): everything for the DM, or what one
 * campaign has been shown for a player. A player with no campaign has a
 * campaign scope that shows nothing (`campaignId: null`).
 */
type VisibilityScope =
  | { kind: "all" }
  | {
      kind: "campaign";
      campaignId: number | null;
      /** Zones visible to the campaign, inheritance applied. */
      zones: ReadonlySet<number>;
      /** Landmarks visible to the campaign, inheritance applied. */
      pois: ReadonlySet<number>;
    };

export default VisibilityScope;
