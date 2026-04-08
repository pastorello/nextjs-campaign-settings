import { Suspense } from "react";
import { Metadata } from "next";

import { TableSkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getDeitiesCount } from "@/app/lib/data/deities/getDeitiesCount";
import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import DeityLibrary from "@/app/ui/deities/DeityLibrary";

export const metadata: Metadata = {
  title: "Oggetti magici",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getDeitiesCount(searchParams ?? {});
  const fetchedItems = await fetchFilteredDeities(props.searchParams ?? {});

  return (
    <ListPage
      title="Divinità"
      searchPlaceholder="Cerca Divinità..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="Divinità"
      itemNameSingular="Divinità"
    >
      <Suspense fallback={<TableSkeleton />}>
        <DeityLibrary itemCount={itemCount} items={fetchedItems || []} />
      </Suspense>
    </ListPage>
  );
}
