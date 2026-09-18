"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { eventTiming } from "@/app/lib/calendar/eventTiming";
import deleteCampaignEventById from "@/app/lib/data/calendar/deleteCampaignEventById";
import campaignEventOwnerMeta from "@/app/lib/config/calendarEvent/campaignEventOwnerMeta";
import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import EventTiming from "@/app/lib/definitions/types/EventTiming";
import EventList, { EventItemAttributes } from "./EventList";
import EventSummary, { EventBadge } from "./EventSummary";
import {
  CampaignCalendarItem,
  toCampaignCalendarItems,
} from "./campaignCalendarItems";
import CampaignEventForm, {
  CampaignEventOwnerOptions,
} from "./CampaignEventForm";

interface CampaignCalendarListProps {
  campaignId: number;
  /** The campaign's events, in order of start (`fetchCampaignEvents`). */
  events: CampaignEvent[];
  /** World history in the range shown (`fetchWorldHistoryBetween`). */
  history: CalendarEventBase[];
  /** The campaign's current day; `null` marks nothing as past. */
  today: number | null;
  systems: readonly DateSystem[];
  displaySystem: DateSystem;
  ownerOptions: CampaignEventOwnerOptions;
}

const ITEM_CLASS: Record<EventTiming | "none", string> = {
  past: "rounded-md border border-gray-200 bg-gray-50 p-4 text-gray-600",
  current: "rounded-md border-2 border-blue-600 bg-sky-50 p-4",
  upcoming: "rounded-md border p-4",
  none: "rounded-md border p-4",
};

const HISTORY_CLASS =
  "rounded-md border border-dashed border-amber-400 bg-amber-50 p-4";

/**
 * A campaign's calendar as a chronological list (SPEC-014 §5.5/§5.6, T6):
 * its own events — past ones dimmed, the one(s) spanning today
 * highlighted, each marked in words as well as colour — and, visually
 * distinct and read-only, the world history events of the same years
 * (§5.4). A yearly event is listed once, where it starts, and judged
 * past/current/upcoming by its occurrence on or after today.
 *
 * The list itself is `EventList`, shared with world history (T5).
 */
export default function CampaignCalendarList({
  campaignId,
  events,
  history,
  today,
  systems,
  displaySystem,
  ownerOptions,
}: CampaignCalendarListProps) {
  const t = useTranslations();
  const system = useGameSystem();

  const items = toCampaignCalendarItems(events, history);

  const timingOf = (item: CampaignCalendarItem) =>
    item.kind === "campaign"
      ? (eventTiming(item, today)?.timing ?? null)
      : null;

  function itemAttributes(item: CampaignCalendarItem): EventItemAttributes {
    if (item.kind === "history") {
      return { className: HISTORY_CLASS, testId: "calendar-history-event" };
    }
    const timing = timingOf(item);
    return {
      className: ITEM_CLASS[timing ?? "none"],
      testId: "campaign-event",
      timing: timing ?? undefined,
    };
  }

  function badges(item: CampaignCalendarItem) {
    if (item.kind === "history") {
      return (
        <EventBadge>{t("calendar.campaign.list.worldHistory")}</EventBadge>
      );
    }
    const timing = timingOf(item);
    if (timing === "past") {
      return <EventBadge>{t("calendar.campaign.list.past")}</EventBadge>;
    }
    if (timing === "current") {
      return <EventBadge>{t("calendar.campaign.list.current")}</EventBadge>;
    }
    return null;
  }

  return (
    <EventList
      events={items}
      displaySystem={displaySystem}
      // A yearly history event is listed once per year, under one id.
      itemKey={(item) => `${item.kind}-${item.id}-${item.startDay}`}
      itemAttributes={itemAttributes}
      isEditable={(item) => item.kind === "campaign"}
      addLabel={t("calendar.campaign.list.addButton")}
      emptyMessage={t("calendar.campaign.list.emptyMessage")}
      onDelete={(item) => deleteCampaignEventById(item.id)}
      renderForm={(item, close) => (
        <CampaignEventForm
          campaignId={campaignId}
          systems={systems}
          displaySystemId={displaySystem.id}
          ownerOptions={ownerOptions}
          event={item?.kind === "campaign" ? item : undefined}
          onCancel={close}
          onSaved={close}
        />
      )}
      renderDetails={(item) => (
        <EventSummary
          event={item}
          displaySystem={displaySystem}
          badges={badges(item)}
        >
          {item.kind === "campaign" && item.adventure !== null && (
            <p className="mt-1 text-sm">
              {t(campaignEventOwnerMeta.adventureId.labelKey)}
              {": "}
              <Link
                href={dashboardPath(system, `/campaign/${item.adventure.id}`)}
                className="text-blue-600 underline"
              >
                {item.adventure.name}
              </Link>
              {item.scene !== null && (
                <>
                  {" · "}
                  {t(campaignEventOwnerMeta.sceneId.labelKey)}
                  {": "}
                  {item.scene.name}
                </>
              )}
            </p>
          )}
        </EventSummary>
      )}
    />
  );
}
