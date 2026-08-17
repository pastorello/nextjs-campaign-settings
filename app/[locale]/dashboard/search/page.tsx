import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import Search from "@/app/ui/search";
import PageTitle from "@/app/ui/typography/PageTitle";
import CrossEntitySearchResults from "@/app/ui/search/CrossEntitySearchResults";
import searchAllDomains from "@/app/lib/data/search/searchAllDomains";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search.page");
  return { title: t("title") };
}

/**
 * The cross-entity search page (SPEC-011 T2) — one read across all six
 * domains via `searchAllDomains`, rendered as up to six grouped result
 * lists by `CrossEntitySearchResults`. Reuses `app/ui/search.tsx` for the
 * debounced input: the same 300ms-debounced `?query=` pattern every list
 * page already uses, writing to this page's own pathname.
 *
 * Sits under `/dashboard/search`, so it inherits the same proxy-matched
 * auth gate as every other `/dashboard/**` page (`proxy.ts`) — no extra
 * guard needed here, since this is a read with no mutation (non-negotiable
 * rule #1 is about mutations).
 */
export default async function SearchPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const t = await getTranslations("search.page");
  const searchParams = await props.searchParams;
  const term = searchParams?.query ?? "";
  const results = await searchAllDomains(term);

  return (
    <div className="w-full">
      <PageTitle className="mb-4">{t("title")}</PageTitle>
      <div className="mb-6">
        <Search placeholder={t("searchPlaceholder")} />
      </div>
      <CrossEntitySearchResults term={term} results={results} />
    </div>
  );
}
