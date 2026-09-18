import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import fetchWorldHistory from "@/app/lib/data/calendar/fetchWorldHistory";
import parseWorldHistorySearchParams from "@/app/lib/data/calendar/parseWorldHistorySearchParams";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import DateSystemToggle from "@/app/ui/calendar/DateSystemToggle";
import WorldHistoryFilters from "@/app/ui/calendar/WorldHistoryFilters";
import WorldHistoryList from "@/app/ui/calendar/WorldHistoryList";
import Pagination from "@/app/ui/components/pagination";
import PageTitle from "@/app/ui/typography/PageTitle";

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
 * the world default. The month grid is T7.
 */
export default async function WorldHistoryPage(
  props: PageProps<"/[locale]/dashboard/[system]/world/history">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const query = parseWorldHistorySearchParams(await props.searchParams);
  const [t, systems, preferredId, history, zones, npcs, deities, factions] =
    await Promise.all([
      getTranslations("calendar.history.page"),
      fetchDateSystems(),
      readDisplayDateSystemId(),
      fetchWorldHistory(query),
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PageTitle>{t("title")}</PageTitle>
        <DateSystemToggle systems={systems} selectedId={displaySystem.id} />
      </div>
      <WorldHistoryFilters query={query} linkOptions={linkOptions} />
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
  );
}
