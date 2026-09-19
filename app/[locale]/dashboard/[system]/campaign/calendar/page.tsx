import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { monthOf } from "@/app/lib/calendar/monthOf";
import { monthRange } from "@/app/lib/calendar/monthRange";
import { parseMonthGridParams } from "@/app/lib/calendar/parseMonthGridParams";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import { yearSpan } from "@/app/lib/calendar/yearSpan";
import { yearlyOccurrencesIn } from "@/app/lib/calendar/yearlyOccurrencesIn";
import fetchCampaign from "@/app/lib/data/campaigns/fetchCampaign";
import fetchCalendarSettings from "@/app/lib/data/calendar/fetchCalendarSettings";
import fetchCampaignEvents from "@/app/lib/data/calendar/fetchCampaignEvents";
import fetchCampaignScenes from "@/app/lib/data/calendar/fetchCampaignScenes";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import fetchWorldHistoryBetween from "@/app/lib/data/calendar/fetchWorldHistoryBetween";
import findEdgeEventDay from "@/app/lib/data/calendar/findEdgeEventDay";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import positiveIdParam from "@/app/lib/utils/positiveIdParam";
import CalendarViewSwitch from "@/app/ui/calendar/CalendarViewSwitch";
import CampaignCalendarFilters from "@/app/ui/calendar/CampaignCalendarFilters";
import CampaignCalendarList from "@/app/ui/calendar/CampaignCalendarList";
import CampaignMonthGrid from "@/app/ui/calendar/CampaignMonthGrid";
import CurrentDayForm from "@/app/ui/calendar/CurrentDayForm";
import DateSystemToggle from "@/app/ui/calendar/DateSystemToggle";
import MonthGridNavigation from "@/app/ui/calendar/MonthGridNavigation";
import PageTitle from "@/app/ui/typography/PageTitle";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar.campaign.page");
  return { title: t("title") };
}

/**
 * The campaign calendar (SPEC-014 §5.5–5.7, T6): the campaign's current
 * day, and its events as a chronological list — filtered by adventure,
 * past ones dimmed, today's highlighted — beside the world history of the
 * same years, shown read-only. Only the route system's campaign is shown
 * (SPEC-018 T3), as on the campaign page; with none, the page says so.
 *
 * The world history shown is every event in the whole years the campaign's
 * events and its current day fall in (`yearSpan`), since the list is
 * grouped by year. Dates are read in the viewer's chosen system (the
 * toggle's cookie), else the world default.
 *
 * `?view=grid` shows one month instead (T7): `?year=&month=` or, absent,
 * today's month, else the first event's (else the display system's year
 * 0) — reading only the events, and the world history, that can fall in
 * that month, yearly ones that started earlier included.
 */
export default async function CampaignCalendarPage(
  props: PageProps<"/[locale]/dashboard/[system]/campaign/calendar">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const searchParams = await props.searchParams;
  const [t, campaign, systems, preferredId] = await Promise.all([
    getTranslations("calendar.campaign"),
    fetchCampaign(system),
    fetchDateSystems(),
    readDisplayDateSystemId(),
  ]);

  if (!campaign) {
    return (
      <div>
        <PageTitle className="mb-4">{t("page.title")}</PageTitle>
        <p className="mb-2">{t("noCampaign")}</p>
        <Link
          href={dashboardPath(system, "/campaign")}
          className="text-blue-600 underline"
        >
          {t("goToCampaign")}
        </Link>
      </div>
    );
  }

  const displaySystem = resolveDisplayDateSystem(systems, preferredId);
  // The migration seeds the universal count, so there is always a system.
  if (displaySystem === undefined) {
    throw new Error("No date system exists; the universal count is missing.");
  }

  const adventures = campaign.adventures.map(({ id, title }) => ({
    id,
    name: title,
  }));
  // Another campaign's adventure (a URL kept across a system switch) is
  // not a filter this calendar can apply: it reads as "all".
  const requested = positiveIdParam(searchParams.adventure);
  const adventureId = adventures.some(({ id }) => id === requested)
    ? requested
    : null;

  const grid = parseMonthGridParams(searchParams);
  const header = (
    <>
      <Link
        href={dashboardPath(system, "/campaign")}
        className="mb-2 inline-block text-sm text-blue-600 underline"
      >
        {t("backToCampaign")}
      </Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PageTitle>{t("page.title")}</PageTitle>
        <DateSystemToggle systems={systems} selectedId={displaySystem.id} />
      </div>
      <CurrentDayForm
        campaignId={campaign.id}
        systems={systems}
        currentDay={campaign.currentDay}
        displaySystem={displaySystem}
      />
      <CampaignCalendarFilters
        adventureId={adventureId}
        adventures={adventures}
      />
      <CalendarViewSwitch view={grid.view} />
    </>
  );

  if (grid.view === "grid") {
    const month =
      grid.month ??
      monthOf(
        campaign.currentDay ??
          (await findEdgeEventDay(
            {
              campaignId: campaign.id,
              ...(adventureId !== null && { adventureId }),
            },
            "first"
          )),
        displaySystem
      );
    const range = monthRange(month);
    const [events, history, scenes, settings] = await Promise.all([
      fetchCampaignEvents(campaign.id, adventureId, range),
      fetchWorldHistoryBetween(range.firstDay, range.lastDay, true),
      fetchCampaignScenes(campaign.id),
      fetchCalendarSettings(),
    ]);
    return (
      <ResolvedRecordLinks
        values={[...events, ...history].map(({ description }) => description)}
        system={system}
      >
        <div>
          {header}
          <MonthGridNavigation
            month={month}
            systems={systems}
            displaySystem={displaySystem}
            today={campaign.currentDay}
          />
          <CampaignMonthGrid
            campaignId={campaign.id}
            month={month}
            events={events}
            history={history}
            today={campaign.currentDay}
            moonReferenceDay={settings.moonNewMoonDay}
            systems={systems}
            displaySystem={displaySystem}
            ownerOptions={{ adventures, scenes }}
          />
        </div>
      </ResolvedRecordLinks>
    );
  }

  const [events, scenes] = await Promise.all([
    fetchCampaignEvents(campaign.id, adventureId),
    fetchCampaignScenes(campaign.id),
  ]);

  const span = yearSpan([
    ...events.flatMap(({ startDay, endDay }) => [startDay, endDay ?? startDay]),
    ...(campaign.currentDay === null ? [] : [campaign.currentDay]),
  ]);
  // A yearly world history event is listed in every year shown, as the
  // grid does, not only in the year it was first held (T9).
  const history = span
    ? yearlyOccurrencesIn(
        await fetchWorldHistoryBetween(span.firstDay, span.lastDay, true),
        span.firstDay,
        span.lastDay
      )
    : [];

  return (
    <ResolvedRecordLinks
      values={[...events, ...history].map(({ description }) => description)}
      system={system}
    >
      <div>
        {header}
        <CampaignCalendarList
          campaignId={campaign.id}
          events={events}
          history={history}
          today={campaign.currentDay}
          systems={systems}
          displaySystem={displaySystem}
          ownerOptions={{ adventures, scenes }}
        />
      </div>
    </ResolvedRecordLinks>
  );
}
