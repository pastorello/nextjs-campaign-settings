/**
 * Payload for assigning (or clearing) an NPC/deity's location (SPEC-008
 * T3). Both fields are required keys, not optional — `null` is how a
 * caller clears a slot back to "Sconosciuta" (§5), so there is no
 * "omitted means leave alone" state here the way `PoiUpdateInput` has for
 * `linkedType`/`linkedId`: the assignment modal always sends the full
 * current selection.
 *
 * `poiId` is a strictly optional refinement of `zoneId`, never independent
 * of it — see ADR-0010 for why the mutation resolves and enforces this
 * rather than trusting the caller's `zoneId` when a `poiId` is given.
 */
interface AssignLocationInput {
  id: number;
  zoneId: number | null;
  poiId: number | null;
}

export default AssignLocationInput;
