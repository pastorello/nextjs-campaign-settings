import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import SearchParams from "@/app/lib/definitions/interfaces/pages/SearchParams";
import fetchRootPlace from "@/app/lib/data/maps/fetchRootPlace";
import fetchPlaceAncestryChain from "@/app/lib/data/maps/fetchPlaceAncestryChain";
import countUnpositionedPlaces from "@/app/lib/data/maps/countUnpositionedPlaces";
import GeographyExplorer from "@/app/ui/geography/GeographyExplorer";
import toStackEntry, {
  type PlaceStackEntry,
} from "@/app/modules/maps/lib/utils/toStackEntry";
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
 *
 * `?place=<id>` (SPEC-011 T4) seeds `GeographyExplorer`'s stack with that
 * place's full ancestor chain instead of starting at the root — the
 * landing spot for a cross-entity place search result. A missing param, a
 * non-numeric one, or an id that no longer resolves to a zone (deleted
 * between the search link being generated and clicked, or a hand-typed
 * garbage value) all fall back to today's root-only behaviour rather than
 * a crash: this is a navigation convenience, not a mutation boundary, so
 * "ignore and show root" is the right failure mode, the same spirit
 * `deletePlace` uses for a raced delete elsewhere in this module (SPEC-010
 * T2) even though that case reports `NotFoundError` because it's a write.
 */
export default async function GeographyPage(
  props: {
    searchParams?: Promise<SearchParams>;
  } = {}
) {
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

  const searchParams = await props.searchParams;
  const placeId = Number(searchParams?.place);
  let initialStack: PlaceStackEntry[] | undefined;
  if (searchParams?.place !== undefined && Number.isInteger(placeId)) {
    const chain = await fetchPlaceAncestryChain(placeId);
    initialStack = chain?.map(toStackEntry);
  }

  return (
    <GeographyExplorer
      root={root}
      unpositionedCount={unpositionedCount}
      {...(initialStack ? { initialStack } : {})}
    />
  );
}
