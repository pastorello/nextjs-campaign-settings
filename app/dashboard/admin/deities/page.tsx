import { Suspense } from "react";
import { Metadata } from "next";

import { TableSkeleton } from "@/app/ui/skeletons";
import Pagination from "@/app/ui/components/pagination";
import Search from "@/app/ui/search";
import BaseButton from "@/app/ui/buttons/BaseButton";
import { ResetButton } from "@/app/ui/buttons/ResetSearchButton";

import DeityList from "@/app/ui/deities/DeityList";
import { getDeitiesCount } from "@/app/lib/data/deities/getDeitiesCount";
import PageTitle from "@/app/ui/typography/PageTitle";

export const metadata: Metadata = {
  title: "Divinità",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getDeitiesCount(searchParams ?? {});
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <PageTitle>Divinità</PageTitle>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Cerca divinità..." />
        <div className="flex shrink-0">
          {itemCount.filtered} di {itemCount.total} divinità trovate
        </div>
        <BaseButton to="deities/new">Nuova divinità</BaseButton>
        <ResetButton />
      </div>
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <DeityList searchParams={props.searchParams} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
