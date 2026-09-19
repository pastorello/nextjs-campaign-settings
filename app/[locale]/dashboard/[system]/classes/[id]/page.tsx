import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import fetchDhClassPage from "@/app/lib/data/dhClasses/fetchDhClassPage";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import DhClassPageView from "@/app/ui/dhClasses/DhClassPageView";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dhClasses.page");
  return { title: t("title") };
}

/**
 * A class's page (SPEC-021 §5.4, T6). The `daggerheart` check is the
 * `classes` layout's; an unknown system was already a 404 in `[system]`'s.
 */
export default async function DhClassRoutePage({
  params,
}: PageProps<"/[locale]/dashboard/[system]/classes/[id]">) {
  const { id: rawId, system } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0 || !isGameSystem(system)) notFound();

  const page = await fetchDhClassPage(id);
  if (!page) notFound();

  const { dhClass, subclasses, cards } = page;

  // Every formatted text on the page: their record links resolve in one
  // batch (SPEC-019 T5).
  return (
    <ResolvedRecordLinks
      values={[
        dhClass.description,
        dhClass.classItems,
        dhClass.hopeFeatureText,
        ...dhClass.features.map((feature) => feature.text),
        ...subclasses.flatMap((subclass) => [
          subclass.description,
          ...subclass.features.map((feature) => feature.text),
        ]),
        ...cards.map((card) => card.featureText),
      ]}
      system={system}
    >
      <DhClassPageView page={page} system={system} />
    </ResolvedRecordLinks>
  );
}
