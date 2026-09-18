"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import deleteWorldHistoryEventById from "@/app/lib/data/calendar/deleteWorldHistoryEventById";
import worldHistoryLinkMeta from "@/app/lib/config/calendarEvent/worldHistoryLinkMeta";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import LinkedRow from "@/app/lib/definitions/interfaces/calendar/LinkedRow";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import EventList from "./EventList";
import EventSummary from "./EventSummary";
import WorldHistoryEventForm, {
  WorldHistoryLinkOptions,
} from "./WorldHistoryEventForm";

interface WorldHistoryListProps {
  /** One page of the history, in order of start (`fetchWorldHistory`). */
  events: WorldHistoryEvent[];
  systems: readonly DateSystem[];
  /** The system every date is shown in — the viewer's toggle. */
  displaySystem: DateSystem;
  linkOptions: WorldHistoryLinkOptions;
}

type LinkKind = "zones" | "npcs" | "deities" | "factions";

const LINK_KINDS: {
  kind: LinkKind;
  labelKey: string;
  href: (row: LinkedRow) => `/${string}`;
}[] = [
  {
    kind: "zones",
    labelKey: worldHistoryLinkMeta.zoneIds.labelKey,
    href: (row) => `/geography?place=${row.id}`,
  },
  {
    kind: "npcs",
    labelKey: worldHistoryLinkMeta.npcIds.labelKey,
    href: (row) => `/npc?query=${encodeURIComponent(row.name)}`,
  },
  {
    kind: "deities",
    labelKey: worldHistoryLinkMeta.deityIds.labelKey,
    href: (row) => `/deities?query=${encodeURIComponent(row.name)}`,
  },
  {
    kind: "factions",
    labelKey: worldHistoryLinkMeta.factionIds.labelKey,
    href: (row) => `/factions?query=${encodeURIComponent(row.name)}`,
  },
];

/**
 * The world's history as a chronological list (SPEC-014 §5.6, T5): events
 * grouped by the year and month they start in, read in the displayed date
 * system. A yearly event is listed once, where it starts, marked "yearly"
 * (§5.4). Each link shows by name and leads where the app already leads
 * for that kind of row — a place to its map, an NPC, deity or faction to
 * its list filtered by name, as the cross-entity search does.
 *
 * The list itself — grouping, add, edit, delete — is `EventList`, shared
 * with the campaign calendar (T6).
 */
export default function WorldHistoryList({
  events,
  systems,
  displaySystem,
  linkOptions,
}: WorldHistoryListProps) {
  const t = useTranslations();
  const system = useGameSystem();

  return (
    <EventList
      events={events}
      displaySystem={displaySystem}
      itemKey={(event) => event.id}
      itemAttributes={() => ({
        className: "rounded-md border p-4",
        testId: "world-history-event",
      })}
      addLabel={t("calendar.history.list.addButton")}
      emptyMessage={t("calendar.history.list.emptyMessage")}
      onDelete={(event) => deleteWorldHistoryEventById(event.id)}
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
      renderDetails={(event) => (
        <EventSummary event={event} displaySystem={displaySystem}>
          {LINK_KINDS.map(({ kind, labelKey, href }) =>
            event[kind].length === 0 ? null : (
              <p key={kind} className="mt-1 text-sm">
                {t(labelKey)}
                {": "}
                {event[kind].map((row, index) => (
                  <span key={row.id}>
                    {index > 0 && ", "}
                    <Link
                      href={dashboardPath(system, href(row))}
                      className="text-blue-600 underline"
                    >
                      {row.name}
                    </Link>
                  </span>
                ))}
              </p>
            )
          )}
        </EventSummary>
      )}
    />
  );
}
