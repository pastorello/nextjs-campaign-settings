import { ReactNode } from "react";
import BaseButton from "../buttons/BaseButton";
import { ResetButton } from "../buttons/ResetSearchButton";
import { lusitana } from "../fonts";
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
  searchParams?: SearchParams;
  newItemRoute?: string;
  children: ReactNode;
}

export const ListPage = ({
  title,
  searchPlaceholder,
  itemCount,
  searchParams,
  itemNamePlural,
  itemNameSingular,
  newItemRoute,
  children,
}: ListPageProps) => {
  return (
    <div className="w-full">
      <PageTitle>{title}</PageTitle>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder={searchPlaceholder} />
        <div className="flex shrink-0">
          {itemCount.filtered} di {itemCount.total}{" "}
          {itemCount.filtered === 1 ? itemNameSingular : itemNamePlural} trovati
        </div>
        {newItemRoute && (
          <BaseButton to={`${newItemRoute}/new`}>
            Nuovo {itemNameSingular}
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
