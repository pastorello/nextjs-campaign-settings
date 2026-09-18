import positiveIdParam from "@/app/lib/utils/positiveIdParam";
import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The world history page's URL — `?place=&npc=&deity=&faction=&page=` —
 * as a query (SPEC-014 §5.6). Anything malformed reads as absent: a filter
 * that is not an id is "any", a page that is not a positive number is the
 * first. The URL is the viewer's to edit, so a bad value is not an error.
 */
export default function parseWorldHistorySearchParams(
  searchParams: SearchParams
): WorldHistoryQuery {
  return {
    place: positiveIdParam(searchParams.place),
    npc: positiveIdParam(searchParams.npc),
    deity: positiveIdParam(searchParams.deity),
    faction: positiveIdParam(searchParams.faction),
    page: positiveIdParam(searchParams.page) ?? 1,
  };
}
