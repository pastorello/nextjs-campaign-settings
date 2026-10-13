import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Link, redirect } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import { upcomingEvents } from "@/app/lib/calendar/upcomingEvents";
import fetchCampaignById from "@/app/lib/data/campaigns/fetchCampaignById";
import fetchAdventureSceneProgress from "@/app/lib/data/campaigns/fetchAdventureSceneProgress";
import fetchCampaignPlayers from "@/app/lib/data/campaigns/fetchCampaignPlayers";
import fetchCampaignEvents from "@/app/lib/data/calendar/fetchCampaignEvents";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import CampaignActions from "@/app/ui/campaigns/CampaignActions";
import CampaignHeader from "@/app/ui/campaigns/CampaignHeader";
import AdventureLadder from "@/app/ui/campaigns/AdventureLadder";
import CampaignPlayersSection from "@/app/ui/campaigns/CampaignPlayers";
import UpcomingEvents from "@/app/ui/calendar/UpcomingEvents";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

/** How many upcoming events the campaign page shows (SPEC-014 §9, 5). */
const UPCOMING_COUNT = 3;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaign.page");
  return { title: t("title") };
}

/**
 * A campaign's page (SPEC-013 §5.1/§5.2, T7; SPEC-032 §5.2): the campaign's
 * own fields plus its adventure ladder, for the campaign in the address.
 * Outside the metadata layer (ADR-0011) — bespoke components under
 * `app/ui/campaigns/`.
 *
 * A campaign opens under its own system (SPEC-018 T3, as the adventure
 * page does): under another system's URL it redirects to its own, keeping
 * the locale. An unknown or malformed id is a 404.
 *
 * Links to the campaign calendar, and shows the next three events coming
 * up after the campaign's current day (SPEC-014 §5.5, T6) — nothing, and
 * no calendar read, while no current day is set.
 *
 * An archived campaign (§5.6) opens as any other, under a banner that says
 * so, with "Riattiva" in place of "Archivia"; nothing in it is read-only.
 *
 * Ends with the campaign's players, its group (SPEC-022 T5).
 */
export default async function CampaignPage({
  params,
}: PageProps<"/[locale]/dashboard/[system]/campaign/[campaignId]">) {
  const { campaignId, system, locale } = await params;
  // `[system]/layout.tsx` has already 404ed this; the guard narrows the type.
  if (!isGameSystem(system)) notFound();

  const id = Number(campaignId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const campaign = await fetchCampaignById(id);
  if (!campaign) notFound();

  if (campaign.system !== system) {
    redirect({
      href: dashboardPath(campaign.system, `/campaign/${id}`),
      locale,
    });
  }

  const t = await getTranslations();

  const [progress, upcoming, players] = await Promise.all([
    fetchAdventureSceneProgress(
      campaign.adventures.map((adventure) => adventure.id)
    ),
    readUpcoming(campaign.id, campaign.currentDay),
    fetchCampaignPlayers(campaign.id),
  ]);

  // The synopsis is formatted text (SPEC-019 T5), shown by the header and
  // opened by its edit form; the upcoming events show titles only.
  return (
    <ResolvedRecordLinks values={[campaign.synopsis]} system={system}>
      <div>
        {campaign.archivedAt && (
          <p
            role="status"
            data-testid="archived-banner"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {t("campaign.archive.banner")}
          </p>
        )}
        <CampaignHeader campaign={campaign} />
        <div className="mt-2">
          <CampaignActions
            campaignId={campaign.id}
            archived={campaign.archivedAt !== null}
          />
        </div>
        <Link
          href={dashboardPath(system, `/campaign/${campaign.id}/calendar`)}
          className="mt-4 inline-block text-blue-600 underline"
        >
          {t("calendar.campaign.link")}
        </Link>
        {upcoming && (
          <UpcomingEvents
            upcoming={upcoming.events}
            displaySystem={upcoming.displaySystem}
            campaignId={campaign.id}
            system={system}
          />
        )}
        <AdventureLadder
          campaignId={campaign.id}
          adventures={campaign.adventures}
          progress={progress}
        />
        <CampaignPlayersSection campaignId={campaign.id} players={players} />
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
