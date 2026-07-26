import { Suspense } from "react";
import { Metadata } from "next";

import Pagination from "@/app/ui/components/pagination";
import Search from "@/app/ui/search";
import { TableSkeleton } from "@/app/ui/skeletons";
import BaseButton from "@/app/ui/buttons/BaseButton";
import { ResetButton } from "@/app/ui/buttons/ResetSearchButton";
import { getSpellsCount } from "@/app/lib/data/spells/getSpellsCount";
import EntityList from "@/app/ui/components/EntityList";
import PageType from "@/app/lib/definitions/types/PageType";
import PageTitle from "@/app/ui/typography/PageTitle";

export const metadata: Metadata = {
  title: "Incantesimi",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getSpellsCount(searchParams ?? {});
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <PageTitle>Incantesimi</PageTitle>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Cerca incantesimo..." />
        <div className="flex shrink-0">
          {itemCount.filtered} di {itemCount.total} incantesimi trovati
        </div>
        <BaseButton to="spells/new">Nuovo Incantesimo</BaseButton>
        <ResetButton />
      </div>
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <EntityList pageType={PageType.Spell} searchParams={searchParams} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={itemCount.filteredPages} />
      </div>
    </div>
  );
}
