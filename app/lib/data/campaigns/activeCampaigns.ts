/**
 * The `where` fragment of a campaign that is not archived (SPEC-032 §5.6).
 * Every read that offers, lists or resolves a campaign spreads this rather
 * than spelling `archivedAt: null` itself, so a new reader cannot forget the
 * archive by writing it differently. The one deliberate exception is a read
 * by id for the DM (`fetchCampaignById`): an archived campaign stays
 * reachable by its address.
 */
export const activeCampaigns = { archivedAt: null } as const;
