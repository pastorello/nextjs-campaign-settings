import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import type { UpcomingEvent } from "@/app/lib/calendar/upcomingEvents";
import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import GameSystem from "@/app/lib/definitions/GameSystem";
import WorldDate from "./WorldDate";

interface UpcomingEventsProps {
  /** The next events after today, soonest first (`upcomingEvents`). */
  upcoming: UpcomingEvent<CalendarEventBase>[];
  displaySystem: DateSystem;
  system: GameSystem;
}

/**
 * The campaign page's "coming up" (SPEC-014 §5.5, T6): the next upcoming
 * events of the campaign's calendar, each on the date it next happens — a
 * yearly event's next occurrence, not the year it was first held — and a
 * link to the calendar. Renders nothing when there is nothing upcoming,
 * which includes a campaign with no current day.
 */
export default function UpcomingEvents({
  upcoming,
  displaySystem,
  system,
}: UpcomingEventsProps) {
  const t = useTranslations("calendar.campaign.upcoming");
  if (upcoming.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-md border border-gray-200 p-4"
      data-testid="upcoming-events"
    >
      <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
      <ul className="mb-2 space-y-1">
        {upcoming.map(({ event, startDay }) => (
          <li key={event.id} className="text-sm">
            <span className="font-medium">{event.title}</span>
            {" — "}
            <WorldDate
              universalDay={startDay}
              hour={event.startHour}
              system={displaySystem}
            />
          </li>
        ))}
      </ul>
      <Link
        href={dashboardPath(system, "/campaign/calendar")}
        className="text-sm text-blue-600 underline"
      >
        {t("openCalendar")}
      </Link>
    </section>
  );
}
