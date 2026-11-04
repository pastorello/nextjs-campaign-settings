import pagesConfig from "@/app/lib/config/pagesConfig";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import PageType from "@/app/lib/definitions/types/PageType";
import type { OptionTableName } from "@/app/lib/definitions/interfaces/meta/PageMeta";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import fetchFieldOptions from "./fetchFieldOptions";

/**
 * Every table a page's fields read their options from, resolved once per
 * request (SPEC-006 §7, decision 10) — `undefined` for a page with none.
 * Read from the metadata, so a table-backed field added to a page is
 * resolved without touching this list (SPEC-021 T4/T5 added the first ones
 * after the NPC's faction).
 */
export default async function fetchOptionBundle(
  pageType: PageType
): Promise<OptionBundle | undefined> {
  const tables = [
    ...new Set(
      pagesConfig[pageType].fields
        .map((key) => fieldMeta[key]?.optionTable)
        .filter((table): table is OptionTableName => table !== undefined)
    ),
  ];
  if (tables.length === 0) return undefined;
  return Object.fromEntries(
    await Promise.all(
      tables.map(async (table) => [table, await fetchFieldOptions(table)])
    )
  ) as OptionBundle;
}
