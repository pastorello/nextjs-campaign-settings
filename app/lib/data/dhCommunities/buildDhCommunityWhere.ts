import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import type VisibilityScope from "@/app/lib/data/visibility/VisibilityScope";

/** The id `getQuery`'s `hasSome` filter names, or null when it holds none. */
function filteredId(condition: unknown): number | null {
  if (typeof condition !== "object" || condition === null) return null;
  const values = (condition as { hasSome?: unknown }).hasSome;
  const id = Array.isArray(values) ? Number(values[0]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * The community list's place and faction filters (SPEC-027 §5.4), for the
 * list and its count alike. `getQuery` reads every array field as a scalar
 * list (`hasSome`); a community's places and factions are relations, so
 * this turns each into a `some` relation filter.
 *
 * For a player (SPEC-022), a place they cannot see or a faction not
 * revealed to them matches nothing: filtering by it would say which
 * communities it is linked to. `factionIds` is
 * `fetchRevealedIds("faction")`, null for the DM.
 */
export default function buildDhCommunityWhere(
  where: Record<string, unknown>,
  scope: VisibilityScope,
  factionIds: ReadonlySet<number> | null
): Record<string, unknown> {
  const {
    [DhCommunityMetaField.placeIds]: placeFilter,
    [DhCommunityMetaField.factionIds]: factionFilter,
    ...rest
  } = where;
  const placeId = filteredId(placeFilter);
  const factionId = filteredId(factionFilter);
  const hidden = { id: { in: [] as number[] } };

  return {
    ...rest,
    ...(placeId !== null && {
      places:
        scope.kind === "all" || scope.zones.has(placeId)
          ? { some: { id: placeId } }
          : { some: hidden },
    }),
    ...(factionId !== null && {
      factions:
        factionIds === null || factionIds.has(factionId)
          ? { some: { id: factionId } }
          : { some: hidden },
    }),
  };
}
