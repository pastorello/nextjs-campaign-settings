/**
 * The cookie naming the campaign a player is viewing (SPEC-022 §9). It is a
 * preference, not a grant: `getViewer` checks it against the player's
 * memberships on every read, and falls back to their first campaign.
 */
export const CAMPAIGN_COOKIE = "campaign";
