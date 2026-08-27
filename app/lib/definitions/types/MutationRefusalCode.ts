/**
 * Why a mutation refused a structurally valid request — a machine-readable
 * reason carried beside `MutationResult`'s human-readable `errors` map, so a
 * caller can render the refusal from its own catalogue (ADR-0007) instead of
 * matching on the English prose the data layer writes.
 *
 * `alreadyPlaced` is TD-93's placement invariant: something already placed
 * somewhere must be removed from there before it can be placed anywhere
 * else. Refused for a place that already has coordinates and for an entity
 * that already has a location reference; never for the removal itself,
 * which is the recovery path the refusal points at.
 */
type MutationRefusalCode = "alreadyPlaced";

export default MutationRefusalCode;
