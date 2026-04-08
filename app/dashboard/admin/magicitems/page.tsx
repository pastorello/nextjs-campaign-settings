import { Suspense } from "react";
import { Metadata } from "next";

import Pagination from "@/app/ui/components/pagination";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { TableSkeleton } from "@/app/ui/skeletons";
import MagicItemsList from "@/app/ui/magicitems/MagicItemsList";
import BaseButton from "@/app/ui/buttons/BaseButton";
import { ResetButton } from "@/app/ui/buttons/ResetSearchButton";
import { getMagicItemsCount } from "@/app/lib/data/magicitems/getMagicItemsCount";
import PageTitle from "@/app/ui/typography/PageTitle";

export const metadata: Metadata = {
  title: "Magic Items",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getMagicItemsCount(searchParams ?? {});
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <PageTitle>Oggetti magici</PageTitle>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Cerca oggetti magici..." />
        <div className="flex shrink-0">
          {itemCount.filtered} di {itemCount.total} oggetti magici trovati
        </div>
        <BaseButton to="magicitems/new">Nuovo oggetto magico</BaseButton>
        <ResetButton />
      </div>
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <MagicItemsList searchParams={props.searchParams} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
