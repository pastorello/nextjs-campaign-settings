import { Suspense } from "react";
import { Metadata } from "next";

import { TableSkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getMagicItemsCount } from "@/app/lib/data/magicitems/getMagicItemsCount";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import MagicItemLibrary from "@/app/ui/magicitems/MagicItemLibrary";

export const metadata: Metadata = {
  title: "Oggetti magici",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getMagicItemsCount(searchParams ?? {});
  const fetchedItems = await fetchFilteredMagicItems(props.searchParams ?? {});

  return (
    <ListPage
      title="Oggetti magici"
      searchPlaceholder="Cerca oggetto magici..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="oggetti magici"
      itemNameSingular="oggetto magico"
    >
      <Suspense fallback={<TableSkeleton />}>
        <MagicItemLibrary itemCount={itemCount} items={fetchedItems || []} />
      </Suspense>
    </ListPage>
  );
}
