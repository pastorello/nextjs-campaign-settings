import { Suspense } from "react";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { Metadata } from "next";

import { LibrarySkeleton } from "@/app/ui/skeletons";
import { getSpellsCount } from "@/app/lib/data/spells/getSpellsCount";
import { ListPage } from "@/app/ui/containers/ListPage";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export const metadata: Metadata = {
  title: "Incantesimi",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getSpellsCount(searchParams ?? {});

  return (
    <ListPage
      title="Incantesimi"
      searchPlaceholder="Cerca incantesimo..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="incantesimi"
      itemNameSingular="incantesimo"
    >
      <Suspense fallback={<LibrarySkeleton />}>
        <EntityLibrary
          pageType={PageType.Spell}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
