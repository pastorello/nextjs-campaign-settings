import { ReactNode } from "react";
import { useTranslations } from "next-intl";

import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldDate from "./WorldDate";

interface EventSummaryProps {
  event: CalendarEventBase;
  /** The system every date is shown in — the viewer's toggle. */
  displaySystem: DateSystem;
  /** Extra markers after the title, beside "yearly". */
  badges?: ReactNode;
  /** What the kind of event adds below its description (links, owner). */
  children?: ReactNode;
}

/** A small pill after an event's title. */
export function EventBadge({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-medium uppercase">
      {children}
    </span>
  );
}

/**
 * One event as the chronological lists show it (SPEC-014 §5.6): its title
 * (marked "yearly" when it repeats, §5.4), its start and end read in the
 * displayed system, and its description. Shared by world history (T5) and
 * the campaign calendar (T6); each adds its own details as children.
 */
export default function EventSummary({
  event,
  displaySystem,
  badges,
  children,
}: EventSummaryProps) {
  const t = useTranslations("calendar.history.list");

  return (
    <div>
      <p className="text-lg font-semibold">
        {event.title}
        {event.repeatsYearly && <EventBadge>{t("yearly")}</EventBadge>}
        {badges}
      </p>
      <p className="text-sm text-gray-600">
        <WorldDate
          universalDay={event.startDay}
          hour={event.startHour}
          system={displaySystem}
        />
        {event.endDay !== null && (
          <>
            {` ${t("rangeSeparator")} `}
            <WorldDate
              universalDay={event.endDay}
              hour={event.endHour}
              system={displaySystem}
            />
          </>
        )}
      </p>
      {event.description && (
        <p className="mt-1 text-sm whitespace-pre-line text-gray-700">
          {event.description}
        </p>
      )}
      {children}
    </div>
  );
}
