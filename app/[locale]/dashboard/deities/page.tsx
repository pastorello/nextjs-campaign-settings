import { Suspense } from "react";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { Metadata } from "next";

import { LibrarySkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getDeitiesCount } from "@/app/lib/data/deities/getDeitiesCount";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export const metadata: Metadata = {
  title: "Divinità",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getDeitiesCount(searchParams ?? {});

  return (
    <ListPage
      title="Divinità"
      searchPlaceholder="Cerca Divinità..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="Divinità"
      itemNameSingular="Divinità"
    >
      <Suspense fallback={<LibrarySkeleton />}>
        <EntityLibrary
          pageType={PageType.Deity}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
