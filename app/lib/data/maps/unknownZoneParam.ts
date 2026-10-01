/**
 * The `?zoneId=` value meaning "Sconosciuta" — `zoneId IS NULL` (SPEC-008
 * §5). A file of its own so the client filter control can read it without
 * importing `buildLocationWhere`, which reads the database.
 */
export const UNKNOWN_ZONE_PARAM = "none";
