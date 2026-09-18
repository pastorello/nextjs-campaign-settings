"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import deleteDateSystemById from "@/app/lib/data/calendar/deleteDateSystemById";
import setDefaultDateSystem from "@/app/lib/data/calendar/setDefaultDateSystem";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

import DateSystemForm from "./DateSystemForm";

interface DateSystemsPanelProps {
  /** Every date system, universal first, as `fetchDateSystems` returns them. */
  systems: DateSystem[];
}

/**
 * The date systems half of `/world/calendar` (SPEC-014 §5.2, §5.7): the
 * universal count first, then the DM's own systems, the default marked;
 * create, edit and delete inline; "Make default" on every other row.
 * Outside the metadata layer — a settings panel, not a domain (§7) — so a
 * bespoke list like `LootList`, with the same confirm dialog for deletes.
 *
 * The universal count and the default offer no delete: the actions refuse
 * both (`deleteDateSystemById`), and a button that can only fail is noise.
 * A refusal that still arrives — the default moved in another tab — is
 * shown from its field-error key.
 */
export default function DateSystemsPanel({ systems }: DateSystemsPanelProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DateSystem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const others = systems.filter((system) => !system.isUniversal);

  function refusal(result: Extract<MutationResult, { ok: false }>) {
    return resolveFirstFieldError(result.errors, t) ?? "";
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteDateSystemById(pendingDelete.id);
      if (result.ok) {
        notifySuccess(
          t("common.deleteButton.deleted", { name: pendingDelete.name })
        );
        router.refresh();
      } else {
        notifyError(
          t("calendar.systems.deleteRefused", { reason: refusal(result) })
        );
      }
      setPendingDelete(null);
    } catch {
      notifyError(t("common.deleteButton.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSetDefault(system: DateSystem) {
    try {
      const result = await setDefaultDateSystem(system.id);
      if (!result.ok) {
        notifyError(refusal(result));
        return;
      }
      notifySuccess(
        t("calendar.systems.setDefaultDone", { name: system.name })
      );
      router.refresh();
    } catch {
      notifyError(t("calendar.systems.setDefaultFailed"));
    }
  }

  function row(system: DateSystem) {
    if (editingId === system.id) {
      return (
        <li key={system.id} className="rounded-md border p-3">
          <h3 className="mb-2 text-sm font-semibold">
            {t("calendar.systems.form.editTitle", { name: system.name })}
          </h3>
          <DateSystemForm
            system={system}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        </li>
      );
    }

    return (
      <li
        key={system.id}
        className="flex flex-wrap items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
      >
        <div className="flex-1">
          <p>
            <span className="font-medium">{system.name}</span>
            {system.isUniversal && (
              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                {t("calendar.systems.universalBadge")}
              </span>
            )}
            {system.isDefault && (
              <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-900">
                {t("calendar.systems.defaultBadge")}
              </span>
            )}
          </p>
          {system.isUniversal ? (
            <>
              <p className="text-gray-600">
                {t("calendar.systems.universalYearLabel", {
                  afterLabel: system.afterLabel,
                  afterAbbrev: system.afterAbbrev,
                })}
              </p>
              <p className="text-gray-600">
                {t("calendar.systems.universalNote")}
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                {t("calendar.systems.anchor", {
                  event: system.anchorEvent ?? "",
                  year: system.anchorYear,
                })}
              </p>
              <p className="text-gray-600">
                {t("calendar.systems.yearLabels", {
                  afterLabel: system.afterLabel,
                  afterAbbrev: system.afterAbbrev,
                  beforeLabel: system.beforeLabel ?? "",
                  beforeAbbrev: system.beforeAbbrev ?? "",
                })}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!system.isDefault && (
            <BaseButton
              onClick={() => void handleSetDefault(system)}
              size={ButtonSize.small}
              variant={ButtonVariant.secondary}
            >
              {t("calendar.systems.setDefaultButton")}
            </BaseButton>
          )}
          <BaseButton
            onClick={() => setEditingId(system.id)}
            size={ButtonSize.small}
            variant={ButtonVariant.secondary}
          >
            {t("common.table.edit")}
          </BaseButton>
          {!system.isUniversal && !system.isDefault && (
            <BaseButton
              onClick={() => setPendingDelete(system)}
              size={ButtonSize.small}
              variant={ButtonVariant.danger}
            >
              {t("common.form.delete")}
            </BaseButton>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-3">
      <ul aria-label={t("calendar.systems.title")} className="space-y-2">
        {systems.map(row)}
      </ul>

      {others.length === 0 && (
        <p className="text-sm text-gray-600">{t("calendar.systems.empty")}</p>
      )}

      {isAdding ? (
        <div className="rounded-md border p-3">
          <h3 className="mb-2 text-sm font-semibold">
            {t("calendar.systems.form.createTitle")}
          </h3>
          <DateSystemForm
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      ) : (
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("calendar.systems.addButton")}
        </BaseButton>
      )}

      {pendingDelete && (
        <Modal
          isOpen={pendingDelete !== null}
          setIsOpen={(next) => {
            if (!next) setPendingDelete(null);
          }}
          title={t("common.deleteButton.confirmTitle", {
            name: pendingDelete.name,
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
