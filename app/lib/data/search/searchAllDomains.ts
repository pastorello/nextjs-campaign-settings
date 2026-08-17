import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import searchPlacesByTitle from "@/app/lib/data/maps/searchPlacesByTitle";
import isValidString from "@/app/lib/utils/validators/isValidString";

/** The per-group cap agreed with the DM (SPEC-011 §9, decision 2) — final, not a placeholder. */
export const SEARCH_RESULT_CAP = 5;

/** The six domains cross-entity search covers, in the spec's fixed render order (§5.3). */
export type SearchDomain =
  "spells" | "magicItems" | "npc" | "deities" | "factions" | "places";

/** The name/title-only shape every domain's result is reduced to for this page. */
export interface SearchResultItem {
  id: number;
  name: string;
}

/**
 * One domain's slice of results: `total` is the full match count (before the
 * cap), `items` is capped at `SEARCH_RESULT_CAP` — the difference is what
 * drives the "see all N results" link (§5.4).
 */
export interface SearchDomainGroup {
  total: number;
  items: SearchResultItem[];
}

export type SearchAllDomainsResult = Record<SearchDomain, SearchDomainGroup>;

const emptyGroup = (): SearchDomainGroup => ({ total: 0, items: [] });

const emptyResult = (): SearchAllDomainsResult => ({
  spells: emptyGroup(),
  magicItems: emptyGroup(),
  npc: emptyGroup(),
  deities: emptyGroup(),
  factions: emptyGroup(),
  places: emptyGroup(),
});

const capGroup = (items: SearchResultItem[]): SearchDomainGroup => ({
  total: items.length,
  items: items.slice(0, SEARCH_RESULT_CAP),
});

/**
 * One read across all six domains (SPEC-011 T1) — five existing
 * `fetchFiltered*` functions, called unmodified with `{ query: term }` and
 * nothing else (the exact `getQuery.ts` mechanism every list page already
 * runs), plus the new `searchPlacesByTitle` for the sixth. No new
 * where-clause construction for the first five.
 *
 * An empty/blank term short-circuits before issuing any query — `getQuery.ts`
 * treats an empty string as "no filter" and would otherwise return the first
 * page of every domain, which is not "no matches", it is a different,
 * unrequested query (§5's empty-query edge case).
 *
 * Each `fetchFiltered*` call runs with the full default `itemsPerPage`
 * (`DEFAULT_ITEMS_PER_PAGE`), not a 5-row query — the cap is applied by
 * slicing the returned array afterwards. Noted as a real inefficiency if any
 * domain grows by an order of magnitude, not worth solving now (§9 risks).
 */
export default async function searchAllDomains(
  term: string
): Promise<SearchAllDomainsResult> {
  if (!isValidString(term)) return emptyResult();

  const [spells, magicItems, npc, deities, factions, places] =
    await Promise.all([
      fetchFilteredSpells({ query: term }),
      fetchFilteredMagicItems({ query: term }),
      fetchFilteredNpc({ query: term }),
      fetchFilteredDeities({ query: term }),
      fetchFilteredFactions({ query: term }),
      searchPlacesByTitle(term),
    ]);

  return {
    spells: capGroup(spells.map(({ id, name }) => ({ id, name }))),
    magicItems: capGroup(magicItems.map(({ id, name }) => ({ id, name }))),
    npc: capGroup(npc.map(({ id, name }) => ({ id, name }))),
    deities: capGroup(deities.map(({ id, name }) => ({ id, name }))),
    factions: capGroup(factions.map(({ id, name }) => ({ id, name }))),
    places: capGroup(places.map(({ id, title }) => ({ id, name: title }))),
  };
}
