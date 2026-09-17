import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import BaseButton from "../buttons/BaseButton";
import { ResetButton } from "../buttons/ResetSearchButton";
import Pagination from "../components/pagination";
import Search from "../search";
import { ItemCount } from "@/app/lib/data/getItemsCount";
import PageTitle from "../typography/PageTitle";

interface ListPageProps {
  title: string;
  searchPlaceholder: string;
  itemCount: ItemCount;
  itemNamePlural: string;
  itemNameSingular: string;
  searchParams?: SearchParams | undefined;
  newItemRoute?: string | undefined;
  children: ReactNode;
}

export const ListPage = async ({
  title,
  searchPlaceholder,
  itemCount,
  itemNamePlural,
  itemNameSingular,
  newItemRoute,
  children,
}: ListPageProps) => {
  const t = await getTranslations("common.list");

  return (
    <div className="w-full">
      <PageTitle>{title}</PageTitle>
      {/* Wraps below `sm` so the search box keeps a usable width on a phone
          (TD-114), the same shape as `AdminListHeader`. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 md:mt-8 md:flex-nowrap">
        <div className="w-full sm:w-auto sm:flex-1">
          <Search placeholder={searchPlaceholder} />
        </div>
        <div className="flex shrink-0" role="status">
          {t("count", {
            filtered: itemCount.filtered,
            total: itemCount.total,
            item: itemCount.filtered === 1 ? itemNameSingular : itemNamePlural,
          })}
        </div>
        {newItemRoute && (
          <BaseButton to={`${newItemRoute}/new`}>
            {t("newItem", { item: itemNameSingular })}
          </BaseButton>
        )}
        <ResetButton />
      </div>
      {children}
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
};
