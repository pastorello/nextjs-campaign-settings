"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import reorderLoot from "@/app/lib/data/campaigns/reorderLoot";
import deleteLootById from "@/app/lib/data/campaigns/deleteLootById";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import {
  CurrencyUnit,
  toDisplayAmount,
} from "@/app/lib/utils/currency/convertCurrency";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";

import LootForm from "./LootForm";

interface LootListProps {
  sceneId: number;
  loot: Loot[];
  currencyUnit: CurrencyUnit;
  magicItemOptions: ResolvedOption<number>[];
  treasureOptions: ResolvedOption<number>[];
}

function optionLabel(
  options: ResolvedOption<number>[],
  id: number | null
): string | null {
  if (id === null) return null;
  return options.find((option) => option.value === id)?.label ?? null;
}

/**
 * A scene's loot rows, in position order (SPEC-013 §5, T8) — the third of
 * the three nested ordered collections `SceneList` renders per scene.
 * `taken` is deliberately not shown here — the check-off control is T9's.
 * Outside the metadata layer (ADR-0011), same shape as `SceneCreatureList`.
 */
export default function LootList({
  sceneId,
  loot,
  currencyUnit,
  magicItemOptions,
  treasureOptions,
}: LootListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Loot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function moveLoot(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= loot.length) return;

    const reordered = [...loot];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const result = await reorderLoot(
      sceneId,
      reordered.map((row) => row.id)
    );

    if (!result.ok) {
      notifyError(t("common.deleteButton.deleteFailed"));
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteLootById(pendingDelete.id);
      notifySuccess(
        t("common.deleteButton.deleted", { name: pendingDelete.description })
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t("loot.list.title")}</h4>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("loot.list.addButton")}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-3 rounded-md border p-3">
          <LootForm
            sceneId={sceneId}
            nextPosition={loot.length + 1}
            currencyUnit={currencyUnit}
            magicItemOptions={magicItemOptions}
            treasureOptions={treasureOptions}
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      {loot.length === 0 ? (
        <p className="text-sm text-gray-600">{t("loot.list.emptyMessage")}</p>
      ) : (
        <ul className="space-y-2">
          {loot.map((row, index) =>
            editingId === row.id ? (
              <li key={row.id} className="rounded-md border p-3">
                <LootForm
                  sceneId={sceneId}
                  nextPosition={row.position}
                  currencyUnit={currencyUnit}
                  magicItemOptions={magicItemOptions}
                  treasureOptions={treasureOptions}
                  loot={row}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex-1">
                  <span className="font-medium">{row.description}</span>
                  <span className="ml-2 text-gray-600">×{row.quantity}</span>
                  {row.value !== null && (
                    <span className="ml-2 text-gray-600">
                      {toDisplayAmount(row.value, currencyUnit)}{" "}
                      {t(`adventure.currencyUnits.${currencyUnit}`)}
                    </span>
                  )}
                  {optionLabel(magicItemOptions, row.magicItemId) && (
                    <span className="ml-2 text-gray-600">
                      ({optionLabel(magicItemOptions, row.magicItemId)})
                    </span>
                  )}
                  {optionLabel(treasureOptions, row.treasureId) && (
                    <span className="ml-2 text-gray-600">
                      ({optionLabel(treasureOptions, row.treasureId)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <BaseButton
                    onClick={() => void moveLoot(index, -1)}
                    disabled={index === 0}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                    icon={IconType.chevronUp}
                    ariaLabel={t("loot.list.moveUp", {
                      description: row.description,
                    })}
                  />
                  <BaseButton
                    onClick={() => void moveLoot(index, 1)}
                    disabled={index === loot.length - 1}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                    icon={IconType.chevronDown}
                    ariaLabel={t("loot.list.moveDown", {
                      description: row.description,
                    })}
                  />
                  <BaseButton
                    onClick={() => setEditingId(row.id)}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                  >
                    {t("common.table.edit")}
                  </BaseButton>
                  <BaseButton
                    onClick={() => setPendingDelete(row)}
                    size={ButtonSize.small}
                    variant={ButtonVariant.danger}
                  >
                    {t("common.form.delete")}
                  </BaseButton>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {pendingDelete && (
        <Modal
          isOpen={pendingDelete !== null}
          setIsOpen={(next) => {
            if (!next) setPendingDelete(null);
          }}
          title={t("common.deleteButton.confirmTitle", {
            name: pendingDelete.description,
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
