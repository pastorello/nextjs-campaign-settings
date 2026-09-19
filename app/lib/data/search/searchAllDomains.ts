import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import searchPlacesByTitle from "@/app/lib/data/maps/searchPlacesByTitle";
import isValidString from "@/app/lib/utils/validators/isValidString";
import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";

/** The per-group cap agreed with the DM (SPEC-011 §9, decision 2) — final, not a placeholder. */
export const SEARCH_RESULT_CAP = 5;

/** The six domains cross-entity search covers, in the spec's fixed render order (§5.3). */
export const SEARCH_DOMAINS = [
  "spells",
  "magicItems",
  "npc",
  "deities",
  "factions",
  "places",
] as const;

export type SearchDomain = (typeof SEARCH_DOMAINS)[number];

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

/**
 * The list page behind each search domain, whose `pagesConfig.system` decides
 * which game systems the domain is searched under (ADR-0013 rule 10). Places
 * have no page in `pagesConfig`: they are the world, shared by every system,
 * so `null` means "always searched".
 *
 * This is also the hand-written opt-in list of what search covers at all —
 * a domain absent here is never searched, whatever its `system`. Campaign
 * content (SPEC-013) stays out deliberately.
 */
const SEARCH_DOMAIN_PAGE: Record<SearchDomain, PageType | null> = {
  spells: PageType.Spell,
  magicItems: PageType.MagicItem,
  npc: PageType.Npc,
  deities: PageType.Deity,
  factions: PageType.Faction,
  places: null,
};

/**
 * Whether `domain` is searched under the route's `system`: a shared domain
 * (no page, or a page with no `system`) always is, a catalogue only under its
 * own system. `system` is the raw route param, as in `assertPageSystem`;
 * `[system]/layout.tsx` has already rejected unknown ones.
 */
export function isSearchDomainInSystem(
  domain: SearchDomain,
  system: string
): boolean {
  const page = SEARCH_DOMAIN_PAGE[domain];
  return page === null || isPageInSystem(page, system);
}

const pickIdName = ({ id, name }: SearchResultItem): SearchResultItem => ({
  id,
  name,
});

/**
 * One searcher per domain. Five are the existing `fetchFiltered*` functions,
 * called unmodified with `{ query: term }` and nothing else — the exact
 * `getQuery.ts` mechanism every list page already runs — plus
 * `searchPlacesByTitle` for the sixth.
 */
const SEARCHERS: Record<
  SearchDomain,
  (term: string) => Promise<SearchResultItem[]>
> = {
  spells: async (term) =>
    (await fetchFilteredSpells({ query: term })).map(pickIdName),
  magicItems: async (term) =>
    (await fetchFilteredMagicItems({ query: term })).map(pickIdName),
  npc: async (term) =>
    (await fetchFilteredNpc({ query: term })).map(pickIdName),
  deities: async (term) =>
    (await fetchFilteredDeities({ query: term })).map(pickIdName),
  factions: async (term) =>
    (await fetchFilteredFactions({ query: term })).map(pickIdName),
  places: async (term) =>
    (await searchPlacesByTitle(term)).map(({ id, title }) => ({
      id,
      name: title,
    })),
};

const capGroup = (items: SearchResultItem[]): SearchDomainGroup => ({
  total: items.length,
  items: items.slice(0, SEARCH_RESULT_CAP),
});

/**
 * One read across the six domains (SPEC-011 T1), narrowed to the route's
 * game system (ADR-0013 rule 10): the world's domains are always searched,
 * a catalogue only under its own system. A domain left out is not queried
 * at all and comes back as an empty group, which the results view already
 * hides. With `dnd5e` the only system, every domain is searched.
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
  term: string,
  system: string
): Promise<SearchAllDomainsResult> {
  const result = emptyResult();
  if (!isValidString(term)) return result;

  const groups = await Promise.all(
    SEARCH_DOMAINS.filter((domain) =>
      isSearchDomainInSystem(domain, system)
    ).map(
      async (domain) =>
        [domain, capGroup(await SEARCHERS[domain](term))] as const
    )
  );
  for (const [domain, group] of groups) result[domain] = group;
  return result;
}
