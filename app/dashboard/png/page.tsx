import { Suspense } from "react";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { Metadata } from "next";

import { LibrarySkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getPngCount } from "@/app/lib/data/png/getPngCount";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export const metadata: Metadata = {
  title: "Oggetti magici",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getPngCount(searchParams ?? {});

  return (
    <ListPage
      title="Personaggi conosciuti"
      searchPlaceholder="Cerca oggetto magici..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="PNG"
      itemNameSingular="PNG"
    >
      <Suspense fallback={<LibrarySkeleton />}>
        <EntityLibrary
          pageType={PageType.Png}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
