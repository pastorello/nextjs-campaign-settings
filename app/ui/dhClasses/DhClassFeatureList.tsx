"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createDhClassFeature from "@/app/lib/data/dhClasses/createDhClassFeature";
import updateDhClassFeature from "@/app/lib/data/dhClasses/updateDhClassFeature";
import deleteDhClassFeatureById from "@/app/lib/data/dhClasses/deleteDhClassFeatureById";
import reorderDhClassFeatures from "@/app/lib/data/dhClasses/reorderDhClassFeatures";
import DhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhClassFeature";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";
import renderRichText from "@/app/lib/utils/data/renderRichText";

import DhFeatureForm from "./DhFeatureForm";

interface DhClassFeatureListProps {
  classId: number;
  /** In position order. */
  features: DhClassFeature[];
}

/**
 * A class's features, in order, edited inline on the class's edit dialog
 * (SPEC-021 §5.4, ADR-0011) — add, edit, move up or down, delete. Same
 * shape as `LootList`. A class keeps at least one feature: the last one's
 * delete is refused by `deleteDhClassFeatureById`, and the refusal is shown.
 */
export default function DhClassFeatureList({
  classId,
  features,
}: DhClassFeatureListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DhClassFeature | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function moveFeature(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= features.length) return;

    const reordered = [...features];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    try {
      const result = await reorderDhClassFeatures(
        classId,
        reordered.map((feature) => feature.id)
      );
      if (!result.ok) {
        notifyError(t("common.reorder.failed"));
        return;
      }
      router.refresh();
    } catch {
      notifyError(t("common.reorder.failed"));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteDhClassFeatureById(pendingDelete.id);
      if (!result.ok) {
        notifyError(t("common.fieldErrors.classNeedsFeature"));
        setPendingDelete(null);
        return;
      }
      notifySuccess(
        t("common.deleteButton.deleted", { name: pendingDelete.name })
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
    <section aria-labelledby="dh-class-features-title" className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="dh-class-features-title" className="text-lg font-semibold">
          {t("dhClasses.features.title")}
        </h3>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("dhClasses.features.addButton")}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-3 rounded-md border p-3">
          <DhFeatureForm
            save={({ name, text }) =>
              createDhClassFeature({
                classId,
                position: features.length + 1,
                name,
                text,
              })
            }
            submitLabel={t("dhClasses.features.saveButton")}
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      <ul className="space-y-2">
        {features.map((feature, index) =>
          editingId === feature.id ? (
            <li key={feature.id} className="rounded-md border p-3">
              <DhFeatureForm
                initial={feature}
                save={({ name, text }) =>
                  updateDhClassFeature({ id: feature.id, name, text })
                }
                submitLabel={t("dhClasses.features.saveButton")}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={feature.id}
              className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex-1">
                <p className="font-medium">{feature.name}</p>
                <div>{renderRichText(feature.text)}</div>
              </div>
              <div className="flex items-center gap-1">
                <BaseButton
                  onClick={() => void moveFeature(index, -1)}
                  disabled={index === 0}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  icon={IconType.chevronUp}
                  ariaLabel={t("dhClasses.features.moveUp", {
                    name: feature.name,
                  })}
                />
                <BaseButton
                  onClick={() => void moveFeature(index, 1)}
                  disabled={index === features.length - 1}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  icon={IconType.chevronDown}
                  ariaLabel={t("dhClasses.features.moveDown", {
                    name: feature.name,
                  })}
                />
                <BaseButton
                  onClick={() => setEditingId(feature.id)}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  ariaLabel={t("common.table.editItem", { name: feature.name })}
                >
                  {t("common.table.edit")}
                </BaseButton>
                <BaseButton
                  onClick={() => setPendingDelete(feature)}
                  size={ButtonSize.small}
                  variant={ButtonVariant.danger}
                  ariaLabel={t("common.table.deleteItem", {
                    name: feature.name,
                  })}
                >
                  {t("common.form.delete")}
                </BaseButton>
              </div>
            </li>
          )
        )}
      </ul>

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
    </section>
  );
}
