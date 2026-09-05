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
 *
 * `wouldCycle` is SPEC-017 T5's structural refusal: a place may not be
 * placed on its own map or on the map of anything it contains, which would
 * cut that subtree off the root. Unlike `alreadyPlaced` there is no
 * recovery path to point at — the DM has to pick a different destination,
 * so the caller's message says what is wrong rather than what to do next.
 */
type MutationRefusalCode = "alreadyPlaced" | "wouldCycle";

export default MutationRefusalCode;
