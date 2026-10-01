import type VisibilityScope from "./VisibilityScope";

/**
 * The Prisma `where` fragment for a record that is revealed one by one
 * (NPCs, deities, magic items, factions; SPEC-022 T6a) under `scope`:
 * nothing for the DM, revealed to the campaign for a player, and no row at
 * all for a player without a campaign.
 */
export default function revealedWhere(scope: VisibilityScope) {
  if (scope.kind === "all") return {};
  if (scope.campaignId === null) return { id: { in: [] as number[] } };
  return { revealedTo: { some: { id: scope.campaignId } } };
}
