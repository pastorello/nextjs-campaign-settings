import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import fetchRootPlace from "@/app/lib/data/maps/fetchRootPlace";
import countUnpositionedPlaces from "@/app/lib/data/maps/countUnpositionedPlaces";
import GeographyExplorer from "@/app/ui/geography/GeographyExplorer";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("geography.page");
  return { title: t("title") };
}

/**
 * The tree-navigation entry point (SPEC-004 §10 M7). The hardcoded four-map
 * switcher this page used to render is gone — replaced by the tree itself,
 * per the spec's own instruction. `public/maps/**` and their message keys
 * are untouched: migrating the four legacy maps into the tree is SPEC-004
 * T3, beyond the MVP, not this milestone.
 */
export default async function GeographyPage() {
  const t = await getTranslations("geography");
  const root = await fetchRootPlace();

  if (!root) {
    return (
      <div>
        <PageTitle className="mb-4">{t("page.title")}</PageTitle>
        <p className="mb-4">{t("noWorldYet")}</p>
        <Link href="/dashboard/world" className="text-blue-600 underline">
          {t("createWorldLink")}
        </Link>
      </div>
    );
  }

  // No tree to count on an empty installation (SPEC-007 §5 edge cases) — the
  // branch above already returns before this runs.
  const unpositionedCount = await countUnpositionedPlaces();

  return (
    <GeographyExplorer root={root} unpositionedCount={unpositionedCount} />
  );
}
