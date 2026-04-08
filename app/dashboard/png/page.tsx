import { Suspense } from "react";
import { Metadata } from "next";

import { TableSkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getPngCount } from "@/app/lib/data/png/getPngCount";
import { fetchFilteredPng } from "@/app/lib/data/png/fetchFilteredPng";
import PngLibrary from "@/app/ui/png/PngLibrary";

export const metadata: Metadata = {
  title: "Oggetti magici",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getPngCount(searchParams ?? {});
  const fetchedItems = await fetchFilteredPng(props.searchParams ?? {});

  return (
    <ListPage
      title="Personaggi conosciuti"
      searchPlaceholder="Cerca oggetto magici..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="PNG"
      itemNameSingular="PNG"
    >
      <Suspense fallback={<TableSkeleton />}>
        <PngLibrary itemCount={itemCount} items={fetchedItems || []} />
      </Suspense>
    </ListPage>
  );
}
