/**
 * What a world history event links to (SPEC-014 §5.4): any number of
 * places, NPCs, deities and factions. Campaign events have none of these.
 * Each key is a list of ids in the payload; the page filters by one of each
 * through the URL (`parseWorldHistorySearchParams`).
 */
enum WorldHistoryLinkField {
  zoneIds = "zoneIds",
  npcIds = "npcIds",
  deityIds = "deityIds",
  factionIds = "factionIds",
}

export default WorldHistoryLinkField;
