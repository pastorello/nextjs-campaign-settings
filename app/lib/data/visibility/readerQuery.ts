import pageMetaFields from "@/app/lib/config/pageMetaFields";
import pagesConfig from "@/app/lib/config/pagesConfig";
import queryFields from "@/app/lib/config/queryFields";
import type PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import type MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import type PageType from "@/app/lib/definitions/types/PageType";

import type { RawSearchParams } from "../validateParams";
import type VisibilityScope from "./VisibilityScope";

/** A page's fields declared `dmOnly` in their `PageMeta` (SPEC-022 §5). */
export function dmOnlyFields(pageType: PageType): MetaConfigKey[] {
  return pagesConfig[pageType].fields.filter((key) => {
    // Widened to the interface: the registry's own type is each entry's
    // literal, and only the entries that declare `dmOnly` carry the key.
    const meta: PageMeta = pageMetaFields[key];
    return meta.dmOnly === true;
  });
}

/**
 * A list's query as the reader may run it (SPEC-022 T8b). For the DM it is
 * unchanged. For a player the DM-only fields leave the filterable fields,
 * their parameters are dropped, and so are their sort terms: filtering or
 * sorting by a secret is a way to read it.
 */
export function readerQueryInput(
  pageType: PageType,
  params: RawSearchParams,
  scope: VisibilityScope
): { params: RawSearchParams; fields: MetaConfigKey[] } {
  if (scope.kind === "all") {
    return { params, fields: queryFields[pageType] };
  }
  const hidden = new Set<string>(dmOnlyFields(pageType));
  const fields = queryFields[pageType].filter((key) => !hidden.has(key));
  const safe = Object.fromEntries(
    Object.entries(params).filter(([key]) => !hidden.has(key))
  );
  if (safe.sortFields !== undefined) {
    safe.sortFields = withoutSortTerms(safe.sortFields, hidden);
  }
  return { params: safe, fields };
}

/** `sortFields` is a JSON object of field → direction; drops `hidden`'s. */
function withoutSortTerms(
  sortFields: string,
  hidden: ReadonlySet<string>
): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(sortFields);
  } catch {
    // `validateParams` turns a malformed value into no sort at all.
    return sortFields;
  }
  if (typeof parsed !== "object" || parsed === null) return sortFields;
  const kept = Object.entries(parsed).filter(([key]) => !hidden.has(key));
  return kept.length > 0 ? JSON.stringify(Object.fromEntries(kept)) : undefined;
}

/**
 * Rows as the reader may receive them: for a player, each DM-only field
 * holds its `PageMeta` default instead of its value, so it never reaches
 * the response.
 */
export function forReader<TRow extends object>(
  pageType: PageType,
  rows: TRow[],
  scope: VisibilityScope
): TRow[] {
  if (scope.kind === "all") return rows;
  const blanks = Object.fromEntries(
    dmOnlyFields(pageType).map((key) => [key, pageMetaFields[key].defaultValue])
  );
  return rows.map((row) => ({ ...row, ...blanks }));
}

/** `where` narrowed by the scope's fragment, leaving it as is for the DM. */
export function andWhere<TWhere extends object>(
  where: TWhere,
  scopeWhere: object
): TWhere {
  return Object.keys(scopeWhere).length === 0
    ? where
    : ({ AND: [where, scopeWhere] } as TWhere);
}
