/**
 * An entity's current location, resolved for display (SPEC-008 T5) — the
 * assignment button's "current location" line needs this before the modal
 * even opens. `title` is the POI's own title if `poiId` is set, else the
 * Zone's, else `null` (rendered as "Sconosciuta" at the render boundary,
 * ADR-0007). The eventual `location` list column (T6) resolves the same
 * way; this may end up shared with it then.
 */
interface LocationSummary {
  zoneId: number | null;
  poiId: number | null;
  title: string | null;
}

export default LocationSummary;
