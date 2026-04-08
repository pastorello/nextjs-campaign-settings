import { Suspense } from "react";
import { Metadata } from "next";

import { TableSkeleton } from "@/app/ui/skeletons";
import { getSpellsCount } from "@/app/lib/data/spells/getSpellsCount";
import { ListPage } from "@/app/ui/containers/ListPage";
import SpellLibrary from "@/app/ui/spells/SpellLibrary";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";

export const metadata: Metadata = {
  title: "Incantesimi",
};

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const itemCount = await getSpellsCount(searchParams ?? {});
  const fetchedItems = await fetchFilteredSpells(props.searchParams ?? {});

  return (
    <ListPage
      title="Incantesimi"
      searchPlaceholder="Cerca incantesimo..."
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural="incantesimi"
      itemNameSingular="incantesimo"
    >
      <Suspense fallback={<TableSkeleton />}>
        <SpellLibrary itemCount={itemCount} items={fetchedItems || []} />
      </Suspense>
    </ListPage>
  );
}
