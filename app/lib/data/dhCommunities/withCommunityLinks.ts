import type VisibilityScope from "@/app/lib/data/visibility/VisibilityScope";
import type DhCommunityLink from "@/app/lib/definitions/interfaces/daggerheart/DhCommunityLink";

interface LinkedRow {
  places: { id: number; title: string }[];
  factions: { id: number; name: string }[];
}

/**
 * A community row as the reader receives it (SPEC-027 T3): its links as
 * the form's id lists and as named links for the card. For a player
 * (SPEC-022), only the places their campaign can see and the factions
 * revealed to it: a hidden place's name never reaches them through a
 * community. `factionIds` is `fetchRevealedIds("faction")`, null for the DM.
 */
export default function withCommunityLinks<TRow extends LinkedRow>(
  row: TRow,
  scope: VisibilityScope,
  factionIds: ReadonlySet<number> | null
): Omit<TRow, "places" | "factions"> & {
  places: DhCommunityLink[];
  factions: DhCommunityLink[];
  communityPlaceIds: number[];
  communityFactionIds: number[];
} {
  const places = row.places
    .filter(({ id }) => scope.kind === "all" || scope.zones.has(id))
    .map(({ id, title }) => ({ id, name: title }));
  const factions = row.factions.filter(
    ({ id }) => factionIds === null || factionIds.has(id)
  );
  return {
    ...row,
    places,
    factions,
    communityPlaceIds: places.map(({ id }) => id),
    communityFactionIds: factions.map(({ id }) => id),
  };
}
