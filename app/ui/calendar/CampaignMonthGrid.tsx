"use client";

import { useTranslations } from "next-intl";

import { buildMonthView } from "@/app/lib/calendar/buildMonthView";
import type CalendarMonth from "@/app/lib/calendar/CalendarMonth";
import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import { toCampaignCalendarItems } from "./campaignCalendarItems";
import CampaignEventForm, {
  CampaignEventOwnerOptions,
} from "./CampaignEventForm";
import MonthGrid from "./MonthGrid";

interface CampaignMonthGridProps {
  campaignId: number;
  month: CalendarMonth;
  /** The campaign's events that can fall in the month. */
  events: CampaignEvent[];
  /** World history that can fall in the month, shown read-only. */
  history: CalendarEventBase[];
  /** The campaign's current day; `null` marks nothing as past. */
  today: number | null;
  /** The moon's reference new moon, or `null` for no phases (§5.3). */
  moonReferenceDay: number | null;
  systems: readonly DateSystem[];
  displaySystem: DateSystem;
  ownerOptions: CampaignEventOwnerOptions;
}

/**
 * A campaign's calendar as a month grid (SPEC-014 §5.5/§5.6, T7): today
 * highlighted and earlier days dimmed; the campaign's own events, which
 * open the list's edit form, and the world history of the month, dashed,
 * named as such to a screen reader and read-only — as in the list.
 */
export default function CampaignMonthGrid({
  campaignId,
  month,
  events,
  history,
  today,
  moonReferenceDay,
  systems,
  displaySystem,
  ownerOptions,
}: CampaignMonthGridProps) {
  const t = useTranslations("calendar.grid");
  const items = toCampaignCalendarItems(events, history);

  return (
    <MonthGrid
      month={buildMonthView(month, items, moonReferenceDay)}
      displaySystem={displaySystem}
      today={today}
      itemKey={(item) => `${item.kind}-${item.id}`}
      itemStyle={(item) =>
        item.kind === "campaign"
          ? {
              className: "bg-blue-100 text-blue-900",
              testId: "campaign-grid-event",
            }
          : {
              className:
                "border border-dashed border-amber-500 bg-amber-50 text-amber-900",
              testId: "calendar-history-grid-event",
              label: t("worldHistory"),
            }
      }
      isEditable={(item) => item.kind === "campaign"}
      renderForm={(item, close) => (
        <CampaignEventForm
          campaignId={campaignId}
          systems={systems}
          displaySystemId={displaySystem.id}
          ownerOptions={ownerOptions}
          event={item.kind === "campaign" ? item : undefined}
          onCancel={close}
          onSaved={close}
        />
      )}
    />
  );
}
