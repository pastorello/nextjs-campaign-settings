import fetchZoneDescendantIds from "./fetchZoneDescendantIds";
import type { RawSearchParams } from "../validateParams";

/** The `?zoneId=` value meaning "Sconosciuta" — `zoneId IS NULL` (§5). */
export const UNKNOWN_ZONE_PARAM = "none";

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
 */
export default async function buildLocationWhere<
  TWhere extends Record<string, unknown>,
>(where: TWhere, rawSearchParams: RawSearchParams): Promise<TWhere> {
  let next = where;

  const zoneIdParam = rawSearchParams.zoneId;
  if (zoneIdParam === UNKNOWN_ZONE_PARAM) {
    next = { ...next, zoneId: null };
  } else if (zoneIdParam !== undefined) {
    const zoneId = Number(zoneIdParam);
    if (Number.isInteger(zoneId) && zoneId > 0) {
      const descendantIds = await fetchZoneDescendantIds(zoneId);
      next = { ...next, zoneId: { in: descendantIds } };
    }
  }

  const poiIdParam = rawSearchParams.poiId;
  if (poiIdParam !== undefined) {
    const poiId = Number(poiIdParam);
    if (Number.isInteger(poiId) && poiId > 0) {
      next = { ...next, poiId };
    }
  }

  return next;
}
