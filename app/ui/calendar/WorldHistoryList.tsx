"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import deleteWorldHistoryEventById from "@/app/lib/data/calendar/deleteWorldHistoryEventById";
import { formatSystemYear } from "@/app/lib/calendar/formatWorldDate";
import { groupEventsByYearAndMonth } from "@/app/lib/calendar/groupEventsByYearAndMonth";
import { systemYearFromUniversalYear } from "@/app/lib/calendar/systemYear";
import worldHistoryLinkMeta from "@/app/lib/config/calendarEvent/worldHistoryLinkMeta";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import LinkedRow from "@/app/lib/definitions/interfaces/calendar/LinkedRow";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import WorldDate from "./WorldDate";
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
 * Add and edit happen inline, delete through the confirm dialog — the same
 * shape as the campaign pages' bespoke lists (ADR-0011).
 */
export default function WorldHistoryList({
  events,
  systems,
  displaySystem,
  linkOptions,
}: WorldHistoryListProps) {
  const t = useTranslations();
  const router = useRouter();
  const system = useGameSystem();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorldHistoryEvent | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteWorldHistoryEventById(pendingDelete.id);
      notifySuccess(
        t("common.deleteButton.deleted", { name: pendingDelete.title })
      );
      setPendingDelete(null);
      router.refresh();
    } catch {
      notifyError(t("common.deleteButton.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  const form = (event?: WorldHistoryEvent) => (
    <WorldHistoryEventForm
      systems={systems}
      displaySystemId={displaySystem.id}
      linkOptions={linkOptions}
      event={event}
      onCancel={() => (event ? setEditingId(null) : setIsAdding(false))}
      onSaved={() => (event ? setEditingId(null) : setIsAdding(false))}
    />
  );

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("calendar.history.list.addButton")}
        </BaseButton>
      </div>

      {isAdding && <div className="mb-6 rounded-md border p-4">{form()}</div>}

      {events.length === 0 ? (
        <p>{t("calendar.history.list.emptyMessage")}</p>
      ) : (
        groupEventsByYearAndMonth(events).map((year) => (
          <section key={year.universalYear} className="mb-8">
            <h2 className="mb-3 border-b pb-1 text-xl font-semibold">
              {formatSystemYear(
                systemYearFromUniversalYear(
                  year.universalYear,
                  displaySystem.anchorYear
                ),
                displaySystem
              )}
            </h2>
            {year.months.map((month) => (
              <section key={month.monthIndex} className="mb-4">
                <h3 className="mb-2 text-lg font-medium text-gray-700">
                  {displaySystem.monthNames[month.monthIndex]}
                </h3>
                <ul className="space-y-3">
                  {month.events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-md border p-4"
                      data-testid="world-history-event"
                    >
                      {editingId === event.id ? (
                        form(event)
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-lg font-semibold">
                              {event.title}
                              {event.repeatsYearly && (
                                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-medium uppercase">
                                  {t("calendar.history.list.yearly")}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <WorldDate
                                universalDay={event.startDay}
                                hour={event.startHour}
                                system={displaySystem}
                              />
                              {event.endDay !== null && (
                                <>
                                  {` ${t("calendar.history.list.rangeSeparator")} `}
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
                          </div>
                          <div className="flex items-center gap-1">
                            <BaseButton
                              onClick={() => setEditingId(event.id)}
                              size={ButtonSize.small}
                              variant={ButtonVariant.secondary}
                            >
                              {t("common.table.edit")}
                            </BaseButton>
                            <BaseButton
                              onClick={() => setPendingDelete(event)}
                              size={ButtonSize.small}
                              variant={ButtonVariant.danger}
                            >
                              {t("common.form.delete")}
                            </BaseButton>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        ))
      )}

      {pendingDelete && (
        <Modal
          isOpen={pendingDelete !== null}
          setIsOpen={(next) => {
            if (!next) setPendingDelete(null);
          }}
          title={t("common.deleteButton.confirmTitle", {
            name: pendingDelete.title,
          })}
          description={t("common.deleteButton.confirmDescription")}
          size="small"
        >
          <PageForm
            onCancel={() => setPendingDelete(null)}
            onSaveFinished={() => void handleDelete()}
            isSaving={isDeleting}
          />
        </Modal>
      )}
    </div>
  );
}
