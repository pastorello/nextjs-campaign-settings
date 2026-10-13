import { activeCampaigns } from "@/app/lib/data/campaigns/activeCampaigns";

/**
 * The `include` that reads a record's reveals (SPEC-022 T6): only the
 * campaigns' ids, which `withRevealedIds` flattens for the result schema.
 * Active campaigns only (SPEC-032 §5.6): the form that edits the reveals
 * never holds an archived campaign's id, and `revealedToUpdate` leaves
 * those rows alone.
 */
const revealedToInclude = {
  revealedTo: { where: activeCampaigns, select: { id: true } },
} as const;

export default revealedToInclude;
