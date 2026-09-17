import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { Metadata } from "next";

import { LibrarySkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";

import { getFactionsCount } from "@/app/lib/data/faction/getFactionsCount";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("factions.page");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const t = await getTranslations("factions.page");
  const searchParams = await props.searchParams;
  const itemCount = await getFactionsCount(searchParams ?? {});

  return (
    <ListPage
      title={t("title")}
      searchPlaceholder={t("searchPlaceholder")}
      itemCount={itemCount}
      searchParams={searchParams}
      itemNamePlural={t("itemPlural")}
      itemNameSingular={t("itemSingular")}
    >
      <Suspense fallback={<LibrarySkeleton />}>
        <EntityLibrary
          pageType={PageType.Faction}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
