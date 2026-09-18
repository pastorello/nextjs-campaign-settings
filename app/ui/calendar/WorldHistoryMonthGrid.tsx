"use client";

import { buildMonthView } from "@/app/lib/calendar/buildMonthView";
import type CalendarMonth from "@/app/lib/calendar/CalendarMonth";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import MonthGrid from "./MonthGrid";
import WorldHistoryEventForm, {
  WorldHistoryLinkOptions,
} from "./WorldHistoryEventForm";

interface WorldHistoryMonthGridProps {
  month: CalendarMonth;
  /** What can fall in the month (`fetchWorldHistoryMonth`). */
  events: WorldHistoryEvent[];
  /** The moon's reference new moon, or `null` for no phases (§5.3). */
  moonReferenceDay: number | null;
  systems: readonly DateSystem[];
  displaySystem: DateSystem;
  linkOptions: WorldHistoryLinkOptions;
}

/**
 * World history as a month grid (SPEC-014 §5.6, T7): `MonthGrid` over the
 * month's events, each opening the list's edit form.
 */
export default function WorldHistoryMonthGrid({
  month,
  events,
  moonReferenceDay,
  systems,
  displaySystem,
  linkOptions,
}: WorldHistoryMonthGridProps) {
  return (
    <MonthGrid
      month={buildMonthView(month, events, moonReferenceDay)}
      displaySystem={displaySystem}
      itemKey={(event) => event.id}
      itemStyle={() => ({
        className: "bg-sky-100 text-sky-900",
        testId: "world-history-grid-event",
      })}
      renderForm={(event, close) => (
        <WorldHistoryEventForm
          systems={systems}
          displaySystemId={displaySystem.id}
          linkOptions={linkOptions}
          event={event}
          onCancel={close}
          onSaved={close}
        />
      )}
    />
  );
}
