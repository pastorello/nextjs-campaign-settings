"use client";

import { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { formatSystemYear } from "@/app/lib/calendar/formatWorldDate";
import { groupEventsByYearAndMonth } from "@/app/lib/calendar/groupEventsByYearAndMonth";
import { systemYearFromUniversalYear } from "@/app/lib/calendar/systemYear";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

/** What the list needs of an item: where it sorts, and a name to confirm. */
interface ListedEvent {
  startDay: number;
  title: string;
}

/** How one item is drawn: its `<li>`'s classes and test id. */
export interface EventItemAttributes {
  className: string;
  testId: string;
  /** Read by tests and styling hooks, e.g. "past" (SPEC-014 §5.5). */
  timing?: string | undefined;
}

interface EventListProps<Event extends ListedEvent> {
  /** In order of start; grouped here by the year and month they start in. */
  events: readonly Event[];
  displaySystem: DateSystem;
  itemKey: (event: Event) => string | number;
  itemAttributes: (event: Event) => EventItemAttributes;
  /** The item's read-only body — usually an `EventSummary`. */
  renderDetails: (event: Event) => ReactNode;
  /** The add (no event) or edit form; `close` ends either. */
  renderForm: (event: Event | undefined, close: () => void) => ReactNode;
  /** Whether the item has edit and delete buttons; all do when absent. */
  isEditable?: ((event: Event) => boolean) | undefined;
  onDelete: (event: Event) => Promise<void>;
  addLabel: string;
  emptyMessage: string;
}

/**
 * A chronological list of events with add, edit and delete (SPEC-014 §5.6):
 * events grouped by the year and month they start in, the year read in the
 * displayed system. Generalised from T5's world history list so the
 * campaign calendar (T6) is the same list with its own items — including
 * read-only ones (`isEditable`), the world history it shows beside its own
 * events.
 *
 * Add and edit happen inline, delete through the confirm dialog — the same
 * shape as the campaign pages' bespoke lists (ADR-0011).
 */
export default function EventList<Event extends ListedEvent>({
  events,
  displaySystem,
  itemKey,
  itemAttributes,
  renderDetails,
  renderForm,
  isEditable = () => true,
  onDelete,
  addLabel,
  emptyMessage,
}: EventListProps<Event>) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDelete);
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

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {addLabel}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-6 rounded-md border p-4">
          {renderForm(undefined, () => setIsAdding(false))}
        </div>
      )}

      {events.length === 0 ? (
        <p>{emptyMessage}</p>
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
                  {month.events.map((event) => {
                    const key = itemKey(event);
                    const { className, testId, timing } = itemAttributes(event);
                    return (
                      <li
                        key={key}
                        className={className}
                        data-testid={testId}
                        data-timing={timing}
                      >
                        {editingKey === key ? (
                          renderForm(event, () => setEditingKey(null))
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            {renderDetails(event)}
                            {isEditable(event) && (
                              <div className="flex items-center gap-1">
                                <BaseButton
                                  onClick={() => setEditingKey(key)}
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
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
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
