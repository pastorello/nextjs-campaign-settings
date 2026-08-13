/**
 * Real counts for the delete-place confirmation (SPEC-010 T3, §7) — computed
 * fresh at the moment the DM asks, never a generic warning.
 *
 * `placeCount` unifies child zones and child landmarks: both move up to the
 * grandparent and lose their position identically (rule 4, §9), so the
 * dialog names them as one "places" figure rather than two. `npcCount`/
 * `deityCount` count only entities assigned directly to the place
 * (`poiId: null`) — the ones whose `zoneId` is cleared outright (rule 3).
 * An entity assigned via a landmark keeps that landmark and follows it to
 * the grandparent, so it never loses its location and is not counted here.
 */
interface PlaceDeletionImpact {
  placeCount: number;
  npcCount: number;
  deityCount: number;
}

export default PlaceDeletionImpact;
