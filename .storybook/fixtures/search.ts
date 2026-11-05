import {
  SEARCH_DOMAINS,
  type SearchAllDomainsResult,
  type SearchDomain,
  type SearchResultItem,
} from "@/app/lib/data/search/searchAllDomains";

/**
 * A cross-domain search answer with the given hits and every other domain
 * empty — the shape `searchAllDomains` returns.
 */
export function searchResult(
  hits: Partial<Record<SearchDomain, SearchResultItem[]>> = {}
): SearchAllDomainsResult {
  return Object.fromEntries(
    SEARCH_DOMAINS.map((domain) => {
      const items = hits[domain] ?? [];
      return [domain, { total: items.length, items }];
    })
  ) as SearchAllDomainsResult;
}
