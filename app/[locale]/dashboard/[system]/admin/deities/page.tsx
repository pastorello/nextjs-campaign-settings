import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TableSkeleton } from "@/app/ui/skeletons";
import Pagination from "@/app/ui/components/pagination";
import AdminListHeader from "@/app/ui/containers/AdminListHeader";

import EntityList from "@/app/ui/components/EntityList";
import PageType from "@/app/lib/definitions/types/PageType";
import { getDeitiesCount } from "@/app/lib/data/deities/getDeitiesCount";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deities.page");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const t = await getTranslations("deities.page");
  const tCommon = await getTranslations("common.list");
  const searchParams = await props.searchParams;
  const itemCount = await getDeitiesCount(searchParams ?? {});
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
        newItemHref="deities/new"
        newItemLabel={t("newItemButton")}
      />
      <Suspense
        key={query + currentPage}
        fallback={<TableSkeleton pageType={PageType.Deity} />}
      >
        <EntityList
          pageType={PageType.Deity}
          searchParams={props.searchParams}
        />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
