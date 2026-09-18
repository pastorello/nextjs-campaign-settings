/**
 * What the world history page lists (SPEC-014 §5.6): at most one linked
 * place, NPC, deity and faction to filter by — `null` for "any" — and the
 * page of years. Read from the URL by `parseWorldHistorySearchParams`.
 */
interface WorldHistoryQuery {
  place: number | null;
  npc: number | null;
  deity: number | null;
  faction: number | null;
  /** 1-based. */
  page: number;
}

export default WorldHistoryQuery;
