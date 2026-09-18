import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";

type SearchParams = Record<string, string | string[] | undefined>;

/** A positive whole number from one URL parameter, else `null`. */
function positiveId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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
    place: positiveId(searchParams.place),
    npc: positiveId(searchParams.npc),
    deity: positiveId(searchParams.deity),
    faction: positiveId(searchParams.faction),
    page: positiveId(searchParams.page) ?? 1,
  };
}
