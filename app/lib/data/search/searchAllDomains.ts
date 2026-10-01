import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import searchPlacesByTitle from "@/app/lib/data/maps/searchPlacesByTitle";
import { fetchFilteredDhDomains } from "@/app/lib/data/dhDomains/fetchFilteredDhDomains";
import { fetchFilteredDhDomainCards } from "@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards";
import { fetchFilteredDhClasses } from "@/app/lib/data/dhClasses/fetchFilteredDhClasses";
import { fetchFilteredDhSubclasses } from "@/app/lib/data/dhSubclasses/fetchFilteredDhSubclasses";
import { fetchFilteredDhAncestries } from "@/app/lib/data/dhAncestries/fetchFilteredDhAncestries";
import { fetchFilteredDhCommunities } from "@/app/lib/data/dhCommunities/fetchFilteredDhCommunities";
import { fetchFilteredDhAdversaries } from "@/app/lib/data/dhAdversaries/fetchFilteredDhAdversaries";
import { fetchFilteredDhEnvironments } from "@/app/lib/data/dhEnvironments/fetchFilteredDhEnvironments";
import { fetchFilteredDhWeapons } from "@/app/lib/data/dhWeapons/fetchFilteredDhWeapons";
import { fetchFilteredDhArmor } from "@/app/lib/data/dhArmor/fetchFilteredDhArmor";
import { fetchFilteredDhLoot } from "@/app/lib/data/dhLoot/fetchFilteredDhLoot";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import { PLAYER_PAGES } from "@/app/lib/auth/playerPages";
import isValidString from "@/app/lib/utils/validators/isValidString";
import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";

/** The per-group cap agreed with the DM (SPEC-011 §9, decision 2) — final, not a placeholder. */
export const SEARCH_RESULT_CAP = 5;

/**
 * The domains cross-entity search covers, in the fixed render order (SPEC-011
 * §5.3), the Daggerheart catalogues (SPEC-021 T7) after the world's. Each is
 * searched only under its page's system — see `SEARCH_DOMAIN_PAGE`.
 */
export const SEARCH_DOMAINS = [
  "spells",
  "magicItems",
  "npc",
  "deities",
  "factions",
  "places",
  "dhDomains",
  "dhDomainCards",
  "dhClasses",
  "dhSubclasses",
  "dhAncestries",
  "dhCommunities",
  "dhAdversaries",
  "dhEnvironments",
  "dhWeapons",
  "dhArmor",
  "dhLoot",
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
  dhDomains: emptyGroup(),
  dhDomainCards: emptyGroup(),
  dhClasses: emptyGroup(),
  dhSubclasses: emptyGroup(),
  dhAncestries: emptyGroup(),
  dhCommunities: emptyGroup(),
  dhAdversaries: emptyGroup(),
  dhEnvironments: emptyGroup(),
  dhWeapons: emptyGroup(),
  dhArmor: emptyGroup(),
  dhLoot: emptyGroup(),
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
  dhDomains: PageType.DhDomain,
  dhDomainCards: PageType.DhDomainCard,
  dhClasses: PageType.DhClass,
  dhSubclasses: PageType.DhSubclass,
  dhAncestries: PageType.DhAncestry,
  dhCommunities: PageType.DhCommunity,
  dhAdversaries: PageType.DhAdversary,
  dhEnvironments: PageType.DhEnvironment,
  dhWeapons: PageType.DhWeapon,
  dhArmor: PageType.DhArmor,
  dhLoot: PageType.DhLoot,
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

/**
 * Whether a player may be shown `domain`'s records by search or a record
 * link (SPEC-028 §9 decision 3): when its list page is one they may open
 * (`PLAYER_PAGES`). Places, which have no list, follow the visible tree
 * instead. Opening a page to players opens its search with it.
 */
export function isPlayerSearchDomain(domain: SearchDomain): boolean {
  const page = SEARCH_DOMAIN_PAGE[domain];
  return page === null || PLAYER_PAGES.includes(`/${page}`);
}

const pickIdName = ({ id, name }: SearchResultItem): SearchResultItem => ({
  id,
  name,
});

/**
 * One searcher per domain. Every catalogue's is its existing
 * `fetchFiltered*` function, called unmodified with `{ query: term }` and
 * nothing else — the exact `getQuery.ts` mechanism every list page already
 * runs — and places use `searchPlacesByTitle`.
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
  dhDomains: async (term) =>
    (await fetchFilteredDhDomains({ query: term })).map(pickIdName),
  dhDomainCards: async (term) =>
    (await fetchFilteredDhDomainCards({ query: term })).map(pickIdName),
  dhClasses: async (term) =>
    (await fetchFilteredDhClasses({ query: term })).map(pickIdName),
  dhSubclasses: async (term) =>
    (await fetchFilteredDhSubclasses({ query: term })).map(pickIdName),
  dhAncestries: async (term) =>
    (await fetchFilteredDhAncestries({ query: term })).map(pickIdName),
  dhCommunities: async (term) =>
    (await fetchFilteredDhCommunities({ query: term })).map(pickIdName),
  dhAdversaries: async (term) =>
    (await fetchFilteredDhAdversaries({ query: term })).map(pickIdName),
  dhEnvironments: async (term) =>
    (await fetchFilteredDhEnvironments({ query: term })).map(pickIdName),
  dhWeapons: async (term) =>
    (await fetchFilteredDhWeapons({ query: term })).map(pickIdName),
  dhArmor: async (term) =>
    (await fetchFilteredDhArmor({ query: term })).map(pickIdName),
  dhLoot: async (term) =>
    (await fetchFilteredDhLoot({ query: term })).map(pickIdName),
};

const capGroup = (items: SearchResultItem[]): SearchDomainGroup => ({
  total: items.length,
  items: items.slice(0, SEARCH_RESULT_CAP),
});

/**
 * One read across the search domains (SPEC-011 T1), narrowed to the route's
 * game system (ADR-0013 rule 10): the world's domains are always searched,
 * a catalogue only under its own system. A domain left out is not queried
 * at all and comes back as an empty group, which the results view already
 * hides. Under `daggerheart` the 5e spells and magic items are skipped and
 * the Daggerheart catalogues searched (SPEC-021 T7); under `dnd5e` the
 * reverse.
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

  // A player is not searched the DM's prep (SPEC-028 §9 decision 3).
  const isPlayer = (await getVisibilityScope()).kind === "campaign";
  const groups = await Promise.all(
    SEARCH_DOMAINS.filter(
      (domain) =>
        isSearchDomainInSystem(domain, system) &&
        (!isPlayer || isPlayerSearchDomain(domain))
    ).map(
      async (domain) =>
        [domain, capGroup(await SEARCHERS[domain](term))] as const
    )
  );
  for (const [domain, group] of groups) result[domain] = group;
  return result;
}
