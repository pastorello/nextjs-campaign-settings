import PageType from "@/app/lib/definitions/types/PageType";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import { RawSearchParams } from "@/app/lib/data/validateParams";
import fetchListItems from "@/app/lib/data/lists/fetchListItems";

/**
 * Far above any real setting (30 rows a page: 30,000 records) — reached
 * only if a reader stops honouring `page`, which would otherwise loop.
 */
const MAX_PAGES = 1000;

/**
 * Every row of a list under its current filter (SPEC-033 T1), read page by
 * page through the reader the list itself uses (`fetchListItems`), so the
 * export cannot filter differently from the page the DM is looking at.
 * Walks until a page comes back empty, whatever the page size; `getQuery`'s
 * id tiebreak keeps the pages from overlapping.
 */
export default async function fetchAllListItems(
  pageType: PageType,
  searchParams: RawSearchParams
): Promise<ListItem[]> {
  const items: ListItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const rows = await fetchListItems(pageType, {
      ...searchParams,
      page: String(page),
    });
    if (rows.length === 0) return items;
    items.push(...rows);
  }
  throw new Error(
    `fetchAllListItems: ${pageType} still had rows after ${MAX_PAGES} pages`
  );
}
