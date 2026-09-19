"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createDhSubclassFeature from "@/app/lib/data/dhSubclasses/createDhSubclassFeature";
import updateDhSubclassFeature from "@/app/lib/data/dhSubclasses/updateDhSubclassFeature";
import deleteDhSubclassFeatureById from "@/app/lib/data/dhSubclasses/deleteDhSubclassFeatureById";
import reorderDhSubclassFeatures from "@/app/lib/data/dhSubclasses/reorderDhSubclassFeatures";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";
import groupFeaturesByTier from "@/app/lib/utils/daggerheart/groupFeaturesByTier";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";
import DhFeatureForm from "@/app/ui/dhClasses/DhFeatureForm";

interface DhSubclassFeatureListProps {
  subclassId: number;
  features: DhSubclassFeature[];
}

/**
 * A subclass's features, grouped foundation / specialization / mastery and
 * ordered within each tier, edited inline on the subclass's edit dialog
 * (SPEC-021 §5.5, ADR-0011). Moving up or down stays within the tier; a
 * feature changed to another tier goes to the end of that tier.
 */
export default function DhSubclassFeatureList({
  subclassId,
  features,
}: DhSubclassFeatureListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [addingTier, setAddingTier] = useState<DhSubclassFeatureTier | null>(
    null
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DhSubclassFeature | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const groups = groupFeaturesByTier(features);
  const tierSize = (tier: DhSubclassFeatureTier) =>
    groups.find(([groupTier]) => groupTier === tier)?.[1].length ?? 0;

  async function moveFeature(
    tier: DhSubclassFeatureTier,
    rows: DhSubclassFeature[],
    index: number,
    direction: -1 | 1
  ) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const reordered = [...rows];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    try {
      const result = await reorderDhSubclassFeatures(
        subclassId,
        tier,
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
      await deleteDhSubclassFeatureById(pendingDelete.id);
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
    <section aria-labelledby="dh-subclass-features-title" className="p-4">
      <h3
        id="dh-subclass-features-title"
        className="mb-2 text-lg font-semibold"
      >
        {t("dhSubclasses.features.title")}
      </h3>
      {groups.map(([tier, rows]) => (
        <div key={tier} className="mb-4" data-testid={`tier-${tier}`}>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {t(`dhSubclasses.tiers.${tier}`)}
            </h4>
            <BaseButton
              onClick={() => setAddingTier(tier)}
              size={ButtonSize.small}
              ariaLabel={t("dhSubclasses.features.addToTier", {
                tier: t(`dhSubclasses.tiers.${tier}`),
              })}
            >
              {t("dhSubclasses.features.addButton")}
            </BaseButton>
          </div>

          {addingTier === tier && (
            <div className="mb-3 rounded-md border p-3">
              <DhFeatureForm
                withTier
                initial={{ tier }}
                save={(values) =>
                  createDhSubclassFeature({
                    subclassId,
                    tier: values.tier,
                    position: tierSize(values.tier) + 1,
                    name: values.name,
                    text: values.text,
                  })
                }
                submitLabel={t("dhSubclasses.features.saveButton")}
                onCancel={() => setAddingTier(null)}
                onSaved={() => setAddingTier(null)}
              />
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t("dhSubclasses.features.emptyTier")}
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((feature, index) =>
                editingId === feature.id ? (
                  <li key={feature.id} className="rounded-md border p-3">
                    <DhFeatureForm
                      withTier
                      initial={feature}
                      save={(values) =>
                        updateDhSubclassFeature({
                          id: feature.id,
                          name: values.name,
                          text: values.text,
                          // A new tier takes the feature to its end.
                          ...(values.tier !== feature.tier && {
                            tier: values.tier,
                            position: tierSize(values.tier) + 1,
                          }),
                        })
                      }
                      submitLabel={t("dhSubclasses.features.saveButton")}
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
                        onClick={() => void moveFeature(tier, rows, index, -1)}
                        disabled={index === 0}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                        icon={IconType.chevronUp}
                        ariaLabel={t("dhClasses.features.moveUp", {
                          name: feature.name,
                        })}
                      />
                      <BaseButton
                        onClick={() => void moveFeature(tier, rows, index, 1)}
                        disabled={index === rows.length - 1}
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
                        ariaLabel={t("common.table.editItem", {
                          name: feature.name,
                        })}
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
          )}
        </div>
      ))}

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
