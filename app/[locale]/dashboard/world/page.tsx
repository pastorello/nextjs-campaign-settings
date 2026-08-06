import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import fetchRootPlace from "@/app/lib/data/maps/fetchRootPlace";
import CreateWorldForm from "@/app/ui/geography/CreateWorldForm";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("world.page");
  return { title: t("title") };
}

/**
 * "Create your world" (SPEC-004 §5.1/§10 M4). An empty installation offers
 * exactly one action here; once the root exists this page has nothing left
 * to offer — no second-root path, no edit form. Descending into the tree
 * (M6/M7) is a separate page.
 */
export default async function WorldPage() {
  const t = await getTranslations("world.page");
  const root = await fetchRootPlace();

  return (
    <div>
      <PageTitle className="mb-4">{t("title")}</PageTitle>
      {root ? <p>{t("exists", { title: root.title })}</p> : <CreateWorldForm />}
    </div>
  );
}
