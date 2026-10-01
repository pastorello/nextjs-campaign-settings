import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import getViewer from "@/app/lib/auth/getViewer";
import type { ViewerCampaign } from "@/app/lib/auth/Viewer";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import fetchRootPlace from "@/app/lib/data/maps/fetchRootPlace";
import fetchPlaceAncestryChain from "@/app/lib/data/maps/fetchPlaceAncestryChain";
import countUnpositionedPlaces from "@/app/lib/data/maps/countUnpositionedPlaces";
import countBlockedUnpositionedPlaces from "@/app/lib/data/maps/countBlockedUnpositionedPlaces";
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
 * landing spot for a cross-entity place search result, and, since TD-82,
 * the URL `GeographyExplorer` itself writes on every hop, so a reload
 * reopens the same map. A missing param, a
 * non-numeric one, or an id that no longer resolves to a zone (deleted
 * between the search link being generated and clicked, or a hand-typed
 * garbage value) all fall back to today's root-only behaviour rather than
 * a crash: this is a navigation convenience, not a mutation boundary, so
 * "ignore and show root" is the right failure mode, the same spirit
 * `deletePlace` uses for a raced delete elsewhere in this module (SPEC-010
 * T2) even though that case reports `NotFoundError` because it's a write.
 */
export default async function GeographyPage(
  props: PageProps<"/[locale]/dashboard/[system]/geography">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const t = await getTranslations("geography");
  // The layout sends a request without a session to the login page; this
  // page renders in parallel with it, so it must not read anything first.
  const viewer = await getViewer();
  if (!viewer) notFound();
  if (viewer.kind === "player") {
    return playerGeography(system, viewer.campaign, await props.searchParams);
  }

  const root = await fetchRootPlace();

  if (!root) {
    return (
      <div>
        <PageTitle className="mb-4">{t("page.title")}</PageTitle>
        <p className="mb-4">{t("noWorldYet")}</p>
        <Link
          href={dashboardPath(system, "/world")}
          className="text-blue-600 underline"
        >
          {t("createWorldLink")}
        </Link>
      </div>
    );
  }

  // No tree to count on an empty installation (SPEC-007 §5 edge cases) — the
  // branch above already returns before this runs.
  const [unpositionedCount, blockedUnpositionedCount] = await Promise.all([
    countUnpositionedPlaces(),
    // TD-79 — of the total above, how many are unpositioned specifically
    // because their own parent has no map yet, not because nobody has
    // drawn them on one that exists.
    countBlockedUnpositionedPlaces(),
  ]);

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
      blockedUnpositionedCount={blockedUnpositionedCount}
      {...(initialStack ? { initialStack } : {})}
    />
  );
}

/**
 * A player's map (SPEC-022 T7, R8): the campaign they are viewing, read
 * only. Every read path under the explorer filters by the same scope; this
 * page decides the entry point. The unpositioned pool is the DM's (R15), so
 * its counts are not read.
 *
 * A deep link to a place the campaign cannot see is a 404, and so is one to
 * a place that does not exist: the two must look the same, or the
 * difference would reveal the place.
 */
async function playerGeography(
  system: GameSystem,
  campaign: ViewerCampaign | null,
  searchParams: Record<string, string | string[] | undefined> | undefined
) {
  const t = await getTranslations("geography");
  if (!campaign) {
    return playerMessage(t("page.title"), t("player.noCampaign"));
  }
  // A player reaches only the system of the campaign they are viewing.
  if (campaign.system !== system) notFound();

  const [root, scope] = await Promise.all([
    fetchRootPlace(),
    getVisibilityScope(),
  ]);
  const isVisible = (id: number) => scope.kind === "all" || scope.zones.has(id);
  if (!root || !isVisible(root.id)) {
    return playerMessage(
      t("page.title"),
      t("player.nothingRevealed", { campaign: campaign.title })
    );
  }

  let initialStack: PlaceStackEntry[] | undefined;
  if (searchParams?.place !== undefined) {
    const placeId = Number(searchParams.place);
    const chain = Number.isInteger(placeId)
      ? await fetchPlaceAncestryChain(placeId)
      : null;
    if (!chain?.every((zone) => isVisible(zone.id))) notFound();
    initialStack = chain.map(toStackEntry);
  }

  return (
    <GeographyExplorer
      root={root}
      unpositionedCount={0}
      readOnly
      {...(initialStack ? { initialStack } : {})}
    />
  );
}

function playerMessage(title: string, message: string) {
  return (
    <div>
      <PageTitle className="mb-4">{title}</PageTitle>
      <p>{message}</p>
    </div>
  );
}
