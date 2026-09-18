import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import fetchCalendarSettings from "@/app/lib/data/calendar/fetchCalendarSettings";
import fetchDateSystems from "@/app/lib/data/calendar/fetchDateSystems";
import readDisplayDateSystemId from "@/app/lib/data/calendar/readDisplayDateSystemId";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import DateSystemsPanel from "@/app/ui/calendar/DateSystemsPanel";
import DateSystemToggle from "@/app/ui/calendar/DateSystemToggle";
import MoonReferenceForm from "@/app/ui/calendar/MoonReferenceForm";
import WorldDate from "@/app/ui/calendar/WorldDate";
import PageTitle from "@/app/ui/typography/PageTitle";
import SectionTitle from "@/app/ui/typography/SectionTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar.systems");
  return { title: t("title") };
}

/**
 * The date systems panel (SPEC-014 §5.7, T3): the universal count's names,
 * the DM's other systems, the world default and the moon's reference day.
 *
 * **A shared page** (ADR-0013 rule 4): the calendar is world-level, like
 * geography, so it renders under every game system. It is not a catalogue
 * page — no `pagesConfig` entry, no `assertPageSystem` — only the route's
 * system is checked to be one at all, as `/world` does.
 *
 * The reference new moon is shown in the viewer's display system, with the
 * toggle beside it, so a re-anchored or re-defaulted system re-labels it
 * here as it would anywhere else.
 */
export default async function CalendarPage(
  props: PageProps<"/[locale]/dashboard/[system]/world/calendar">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const [t, systems, settings, preferredId] = await Promise.all([
    getTranslations("calendar"),
    fetchDateSystems(),
    fetchCalendarSettings(),
    readDisplayDateSystemId(),
  ]);
  const displaySystem = resolveDisplayDateSystem(systems, preferredId);
  // The migration seeds the universal count, so an empty table is a broken
  // installation, not a state this page has an answer for.
  if (displaySystem === undefined) notFound();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <PageTitle className="mb-2">{t("systems.title")}</PageTitle>
        <p className="text-sm text-gray-600">{t("systems.intro")}</p>
      </div>

      <section className="space-y-3">
        <DateSystemsPanel systems={systems} />
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("moon.title")}</SectionTitle>
        <p className="text-sm text-gray-600">{t("moon.description")}</p>
        <p className="text-sm">
          {t("moon.current")}{" "}
          {settings.moonNewMoonDay === null ? (
            t("moon.notSet")
          ) : (
            <WorldDate
              universalDay={settings.moonNewMoonDay}
              system={displaySystem}
            />
          )}
        </p>
        <DateSystemToggle systems={systems} selectedId={displaySystem.id} />
        <MoonReferenceForm
          key={settings.moonNewMoonDay ?? "unset"}
          systems={systems}
          moonNewMoonDay={settings.moonNewMoonDay}
          displaySystemId={displaySystem.id}
        />
      </section>
    </div>
  );
}
