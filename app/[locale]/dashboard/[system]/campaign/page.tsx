import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import { upcomingEvents } from "@/app/lib/calendar/upcomingEvents";
import fetchCampaign from "@/app/lib/data/campaigns/fetchCampaign";
import fetchAdventureSceneProgress from "@/app/lib/data/campaigns/fetchAdventureSceneProgress";
import fetchCampaignEvents from "@/app/lib/data/calendar/fetchCampaignEvents";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import CampaignForm from "@/app/ui/campaigns/CampaignForm";
import CampaignHeader from "@/app/ui/campaigns/CampaignHeader";
import AdventureLadder from "@/app/ui/campaigns/AdventureLadder";
import UpcomingEvents from "@/app/ui/calendar/UpcomingEvents";
import PageTitle from "@/app/ui/typography/PageTitle";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

/** How many upcoming events the campaign page shows (SPEC-014 §9, 5). */
const UPCOMING_COUNT = 3;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaign.page");
  return { title: t("title") };
}

/**
 * The campaign page (SPEC-013 §5.1/§5.2, T7): an empty state that creates
 * the DM's one campaign, or the campaign's own fields plus its adventure
 * ladder once it exists. Outside the metadata layer (ADR-0011) — bespoke
 * components under `app/ui/campaigns/`, the same "root exists?" shape
 * `world/page.tsx` already uses for SPEC-004's single root place.
 *
 * Only the route system's campaign is shown (SPEC-018 T3), so another
 * system's URL shows the empty state, with that system preselected.
 *
 * Links to the campaign calendar, and shows the next three events coming
 * up after the campaign's current day (SPEC-014 §5.5, T6) — nothing, and
 * no calendar read, while no current day is set.
 */
export default async function CampaignPage({
  params,
}: PageProps<"/[locale]/dashboard/[system]/campaign">) {
  const { system } = await params;
  // `[system]/layout.tsx` has already 404ed this; the guard narrows the type.
  if (!isGameSystem(system)) notFound();

  const t = await getTranslations();
  const campaign = await fetchCampaign(system);

  if (!campaign) {
    return (
      <div>
        <PageTitle className="mb-4">{t("campaign.page.title")}</PageTitle>
        <p className="mb-4">{t("campaign.emptyState.description")}</p>
        <CampaignForm />
      </div>
    );
  }

  const [progress, upcoming] = await Promise.all([
    fetchAdventureSceneProgress(
      campaign.adventures.map((adventure) => adventure.id)
    ),
    readUpcoming(campaign.id, campaign.currentDay),
  ]);

  // The synopsis is formatted text (SPEC-019 T5), shown by the header and
  // opened by its edit form; the upcoming events show titles only.
  return (
    <ResolvedRecordLinks values={[campaign.synopsis]} system={system}>
      <div>
        <CampaignHeader campaign={campaign} />
        <Link
          href={dashboardPath(system, "/campaign/calendar")}
          className="mt-4 inline-block text-blue-600 underline"
        >
          {t("calendar.campaign.link")}
        </Link>
        {upcoming && (
          <UpcomingEvents
            upcoming={upcoming.events}
            displaySystem={upcoming.displaySystem}
            system={system}
          />
        )}
        <AdventureLadder
          campaignId={campaign.id}
          adventures={campaign.adventures}
          progress={progress}
        />
      </div>
    </ResolvedRecordLinks>
  );
}

/** The next events after `today`, and the date system to read them in. */
async function readUpcoming(campaignId: number, today: number | null) {
  if (today === null) return null;
  const [events, systems, preferredId] = await Promise.all([
    fetchCampaignEvents(campaignId),
    fetchDateSystems(),
    readDisplayDateSystemId(),
  ]);
  const displaySystem = resolveDisplayDateSystem(systems, preferredId);
  if (displaySystem === undefined) return null;
  return {
    events: upcomingEvents(events, today, UPCOMING_COUNT),
    displaySystem,
  };
}
