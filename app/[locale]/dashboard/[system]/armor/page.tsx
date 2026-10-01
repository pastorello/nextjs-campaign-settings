import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import { LibrarySkeleton } from "@/app/ui/skeletons";
import { ListPage } from "@/app/ui/containers/ListPage";
import { getDhArmorCount } from "@/app/lib/data/dhArmor/getDhArmorCount";
import EntityLibrary from "@/app/ui/components/EntityLibrary";
import PageType from "@/app/lib/definitions/types/PageType";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dhArmor.page");
  return { title: t("title") };
}

export default async function Page(props: {
  params: Promise<{ system: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { system } = await props.params;
  const t = await getTranslations("dhArmor.page");
  const searchParams = await props.searchParams;
  const itemCount = await getDhArmorCount(searchParams ?? {});

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
          system={system}
          pageType={PageType.DhArmor}
          searchParams={props.searchParams}
        />
      </Suspense>
    </ListPage>
  );
}
