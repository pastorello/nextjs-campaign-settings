/**
 * Real counts for deleting a landmark (SPEC-023, after TD-147) — computed
 * fresh at the moment the DM asks, like `PlaceDeletionImpact`.
 *
 * A landmark is a leaf, so nothing reparents when it goes: the only rows it
 * affects are the NPCs and deities assigned to it. `deletePoi` clears their
 * `poiId` and keeps their `zoneId`, so these are the characters that stay
 * in the enclosing place without the landmark — none of them loses a
 * location.
 */
interface LandmarkDeletionImpact {
  npcCount: number;
  deityCount: number;
}

export default LandmarkDeletionImpact;
