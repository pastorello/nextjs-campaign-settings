import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { monthOf } from "@/app/lib/calendar/monthOf";
import { monthRange } from "@/app/lib/calendar/monthRange";
import { parseMonthGridParams } from "@/app/lib/calendar/parseMonthGridParams";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import fetchCalendarSettings from "@/app/lib/data/calendar/fetchCalendarSettings";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import fetchWorldHistory from "@/app/lib/data/calendar/fetchWorldHistory";
import fetchWorldHistoryMonth from "@/app/lib/data/calendar/fetchWorldHistoryMonth";
import findEdgeEventDay from "@/app/lib/data/calendar/findEdgeEventDay";
import parseWorldHistorySearchParams from "@/app/lib/data/calendar/parseWorldHistorySearchParams";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import worldHistoryWhere from "@/app/lib/data/calendar/worldHistoryWhere";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import CalendarViewSwitch from "@/app/ui/calendar/CalendarViewSwitch";
import DateSystemToggle from "@/app/ui/calendar/DateSystemToggle";
import MonthGridNavigation from "@/app/ui/calendar/MonthGridNavigation";
import WorldHistoryMonthGrid from "@/app/ui/calendar/WorldHistoryMonthGrid";
import WorldHistoryFilters from "@/app/ui/calendar/WorldHistoryFilters";
import WorldHistoryList from "@/app/ui/calendar/WorldHistoryList";
import Pagination from "@/app/ui/components/pagination";
import PageTitle from "@/app/ui/typography/PageTitle";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar.history.page");
  return { title: t("title") };
}

/**
 * World history (SPEC-014 §5.7, T5): the events that belong to no
 * campaign, as a chronological list grouped by year and month, filtered by
 * linked place, NPC, deity or faction, and paged by year. A shared page
 * (ADR-0013): the world is the same under every game system, so it is not
 * a `pagesConfig` catalogue and the system switch keeps its path.
 *
 * Dates are read in the viewer's chosen system (the toggle's cookie), else
 * the world default.
 *
 * `?view=grid` shows one month instead (T7), `?year=&month=` or, absent,
 * the month of the latest event the filters match (else the display
 * system's year 0) — reading only what can fall in that month.
 */
export default async function WorldHistoryPage(
  props: PageProps<"/[locale]/dashboard/[system]/world/history">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const searchParams = await props.searchParams;
  const query = parseWorldHistorySearchParams(searchParams);
  const grid = parseMonthGridParams(searchParams);
  const [t, systems, preferredId, zones, npcs, deities, factions] =
    await Promise.all([
      getTranslations("calendar.history.page"),
      fetchDateSystems(),
      readDisplayDateSystemId(),
      fetchFieldOptions("zone"),
      fetchFieldOptions("npc"),
      fetchFieldOptions("deities"),
      fetchFieldOptions("faction"),
    ]);

  const displaySystem = resolveDisplayDateSystem(systems, preferredId);
  // The migration seeds the universal count, so there is always a system.
  if (displaySystem === undefined) {
    throw new Error("No date system exists; the universal count is missing.");
  }
  const linkOptions = { zones, npcs, deities, factions };

  const header = (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PageTitle>{t("title")}</PageTitle>
        <DateSystemToggle systems={systems} selectedId={displaySystem.id} />
      </div>
      <WorldHistoryFilters query={query} linkOptions={linkOptions} />
      <CalendarViewSwitch view={grid.view} />
    </>
  );

  if (grid.view === "grid") {
    const month =
      grid.month ??
      monthOf(
        await findEdgeEventDay(worldHistoryWhere(query), "last"),
        displaySystem
      );
    const { firstDay, lastDay } = monthRange(month);
    const [events, settings] = await Promise.all([
      fetchWorldHistoryMonth(query, firstDay, lastDay),
      fetchCalendarSettings(),
    ]);
    return (
      <ResolvedRecordLinks
        values={events.map(({ description }) => description)}
        system={system}
      >
        <div>
          {header}
          <MonthGridNavigation
            month={month}
            systems={systems}
            displaySystem={displaySystem}
          />
          <WorldHistoryMonthGrid
            month={month}
            events={events}
            moonReferenceDay={settings.moonNewMoonDay}
            systems={systems}
            displaySystem={displaySystem}
            linkOptions={linkOptions}
          />
        </div>
      </ResolvedRecordLinks>
    );
  }

  const history = await fetchWorldHistory(query);
  return (
    <ResolvedRecordLinks
      values={history.events.map(({ description }) => description)}
      system={system}
    >
      <div>
        {header}
        <WorldHistoryList
          events={history.events}
          systems={systems}
          displaySystem={displaySystem}
          linkOptions={linkOptions}
        />
        {history.pageCount > 1 && (
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={history.pageCount} />
          </div>
        )}
      </div>
    </ResolvedRecordLinks>
  );
}
