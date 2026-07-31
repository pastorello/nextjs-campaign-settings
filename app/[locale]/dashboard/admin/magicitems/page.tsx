import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Pagination from "@/app/ui/components/pagination";
import Search from "@/app/ui/search";
import { TableSkeleton } from "@/app/ui/skeletons";
import EntityList from "@/app/ui/components/EntityList";
import PageType from "@/app/lib/definitions/types/PageType";
import BaseButton from "@/app/ui/buttons/BaseButton";
import { ResetButton } from "@/app/ui/buttons/ResetSearchButton";
import { getMagicItemsCount } from "@/app/lib/data/magicitems/getMagicItemsCount";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("magicItems.page");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const t = await getTranslations("magicItems.page");
  const tCommon = await getTranslations("common.list");
  const searchParams = await props.searchParams;
  const itemCount = await getMagicItemsCount(searchParams ?? {});
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <PageTitle>{t("title")}</PageTitle>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder={t("searchPlaceholder")} />
        <div className="flex shrink-0">
          {tCommon("count", {
            filtered: itemCount.filtered,
            total: itemCount.total,
            item:
              itemCount.filtered === 1 ? t("itemSingular") : t("itemPlural"),
          })}
        </div>
        <BaseButton to="magicitems/new">{t("newItemButton")}</BaseButton>
        <ResetButton />
      </div>
      <Suspense
        key={query + currentPage}
        fallback={<TableSkeleton pageType={PageType.MagicItem} />}
      >
        <EntityList
          pageType={PageType.MagicItem}
          searchParams={props.searchParams}
        />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
