import { useTranslations } from "next-intl";

import { formatWorldDate } from "@/app/lib/calendar/formatWorldDate";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";

interface WorldDateProps {
  /** A stored universal day (ADR-0015). */
  universalDay: number;
  /** 0–23, or `null`/absent for a date with no hour. */
  hour?: number | null | undefined;
  /**
   * The system to read the day in — the viewer's choice, resolved by the
   * page with `readDisplayDateSystemId` + `resolveDisplayDateSystem`.
   */
  system: DateSystem;
}

/**
 * A date, read in one date system (SPEC-014 §5.1–5.2): "Lunedì 3 Marzo 330
 * a.C., 14:00". Weekday and month names are the system's (DM content); how
 * the parts join is catalogue copy. Not a client component, so a Server
 * Component list renders it without shipping the formatter to the browser.
 */
export default function WorldDate({
  universalDay,
  hour = null,
  system,
}: WorldDateProps) {
  const t = useTranslations("calendar.date");
  const { hour: hourText, ...date } = formatWorldDate(
    universalDay,
    hour,
    system
  );

  return (
    <span>
      {hourText === null
        ? t("full", date)
        : t("fullWithHour", { ...date, hour: hourText })}
    </span>
  );
}
