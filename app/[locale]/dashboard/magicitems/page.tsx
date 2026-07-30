import { Suspense } from "react";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { Metadata } from "next";

import { LibrarySkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getMagicItemsCount } from "@/app/lib/data/magicitems/getMagicItemsCount";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export const metadata: Metadata = {
  title: "Oggetti magici",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getMagicItemsCount(searchParams ?? {});

  return (
    <ListPage
      title="Oggetti magici"
      searchPlaceholder="Cerca oggetto magici..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="oggetti magici"
      itemNameSingular="oggetto magico"
    >
      <Suspense fallback={<LibrarySkeleton />}>
        <EntityLibrary
          pageType={PageType.MagicItem}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
