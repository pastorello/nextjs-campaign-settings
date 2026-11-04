import PageType from "@/app/lib/definitions/types/PageType";
import { RawSearchParams } from "@/app/lib/data/validateParams";

/**
 * Where a list's Markdown export downloads from (SPEC-033 T1): the list's
 * own search params — its filter and order, never its page, since the
 * export holds every page — plus the locale to write labels in. Pass
 * `{ id }` for one record.
 */
export default function exportHref(
  pageType: PageType,
  locale: string,
  params: RawSearchParams = {}
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && key !== "page" && key !== "locale") {
      query.set(key, value);
    }
  }
  query.set("locale", locale);
  return `/api/export/${pageType}?${query.toString()}`;
}
