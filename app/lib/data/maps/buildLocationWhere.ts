import fetchZoneDescendantIds from "./fetchZoneDescendantIds";
import type { RawSearchParams } from "../validateParams";
import type VisibilityScope from "../visibility/VisibilityScope";
import { UNKNOWN_ZONE_PARAM } from "./unknownZoneParam";

/**
 * Layers SPEC-008's Zone/POI filter on top of a `where` clause `getQuery`
 * already built — descendant-inclusive Zone filtering (`IN`, resolved via a
 * tree walk) and "Sconosciuta" (`IS NULL`) are neither expressible by
 * `getQuery`'s generic equality mechanism, so `zoneId`/`poiId` are read
 * directly off the raw search params here rather than declared as
 * `queryFields` entries (§7: "keyed on zoneId", but not through the generic
 * path). The POI narrowing layers on top of whatever the Zone step already
 * set, independent of it — §5: "layered on top of the Zone filter rather
 * than replacing it".
 *
 * For a player (SPEC-022 T8b), a hidden place is no place: a record pinned
 * there counts as "Sconosciuta", a hidden zone's subtree holds no one, and
 * a hidden landmark's filter matches nothing. Otherwise filtering by a
 * hidden place would tell a player who is there.
 */
export default async function buildLocationWhere<
  TWhere extends Record<string, unknown>,
>(
  where: TWhere,
  rawSearchParams: RawSearchParams,
  scope: VisibilityScope
): Promise<TWhere> {
  let next = where;

  const zoneIdParam = rawSearchParams.zoneId;
  if (zoneIdParam === UNKNOWN_ZONE_PARAM) {
    next =
      scope.kind === "all"
        ? { ...next, zoneId: null }
        : {
            ...next,
            OR: [{ zoneId: null }, { zoneId: { notIn: [...scope.zones] } }],
          };
  } else if (zoneIdParam !== undefined) {
    const zoneId = Number(zoneIdParam);
    if (Number.isInteger(zoneId) && zoneId > 0) {
      const descendantIds = await fetchZoneDescendantIds(zoneId);
      const visibleIds =
        scope.kind === "all"
          ? descendantIds
          : descendantIds.filter((id) => scope.zones.has(id));
      next = { ...next, zoneId: { in: visibleIds } };
    }
  }

  const poiIdParam = rawSearchParams.poiId;
  if (poiIdParam !== undefined) {
    const poiId = Number(poiIdParam);
    if (Number.isInteger(poiId) && poiId > 0) {
      next =
        scope.kind === "all" || scope.pois.has(poiId)
          ? { ...next, poiId }
          : { ...next, poiId: { in: [] } };
    }
  }

  return next;
}
