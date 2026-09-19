import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Pagination from "@/app/ui/components/pagination";
import { TableSkeleton } from "@/app/ui/skeletons";
import EntityList from "@/app/ui/components/EntityList";
import PageType from "@/app/lib/definitions/types/PageType";
import AdminListHeader from "@/app/ui/containers/AdminListHeader";
import { getTreasuresCount } from "@/app/lib/data/treasure/getTreasuresCount";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("treasure.page");
  return { title: t("title") };
}

export default async function Page(props: {
  params: Promise<{ system: string }>;
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const { system } = await props.params;
  const t = await getTranslations("treasure.page");
  const tCommon = await getTranslations("common.list");
  const searchParams = await props.searchParams;
  const itemCount = await getTreasuresCount(searchParams ?? {});
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <PageTitle>{t("title")}</PageTitle>
      <AdminListHeader
        searchPlaceholder={t("searchPlaceholder")}
        countText={tCommon("count", {
          filtered: itemCount.filtered,
          total: itemCount.total,
          item: itemCount.filtered === 1 ? t("itemSingular") : t("itemPlural"),
        })}
        newItemHref="treasures/new"
        newItemLabel={t("newItemButton")}
      />
      <Suspense
        key={query + currentPage}
        fallback={<TableSkeleton pageType={PageType.Treasure} />}
      >
        <EntityList
          system={system}
          pageType={PageType.Treasure}
          searchParams={props.searchParams}
        />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
