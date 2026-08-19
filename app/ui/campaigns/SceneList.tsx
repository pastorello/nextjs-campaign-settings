"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import reorderScenes from "@/app/lib/data/campaigns/reorderScenes";
import deleteSceneById from "@/app/lib/data/campaigns/deleteSceneById";
import setSceneAwarded from "@/app/lib/data/campaigns/setSceneAwarded";
import { SceneWithDetails } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";
import { CurrencyUnit } from "@/app/lib/utils/currency/convertCurrency";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";

import SceneForm from "./SceneForm";
import SceneCreatureList from "./SceneCreatureList";
import LootList from "./LootList";
import CheckOffControl from "./CheckOffControl";

interface SceneListProps {
  adventureId: number;
  scenes: SceneWithDetails[];
  currencyUnit: CurrencyUnit;
  zoneOptions: ResolvedOption<number>[];
  npcOptions: ResolvedOption<number>[];
  magicItemOptions: ResolvedOption<number>[];
  treasureOptions: ResolvedOption<number>[];
}

function zoneName(
  zoneOptions: ResolvedOption<number>[],
  zoneId: number | null
): string | null {
  if (zoneId === null) return null;
  return zoneOptions.find((option) => option.value === zoneId)?.label ?? null;
}

/**
 * An adventure's scenes, in position order (SPEC-013 §5.3/§5.4, T8) — the
 * adventure page's main content. Each scene nests its own creatures and
 * loot (`SceneCreatureList`/`LootList`), edited inline. Outside the
 * metadata layer (ADR-0011), same shape as `AdventureLadder`.
 */
export default function SceneList({
  adventureId,
  scenes,
  currencyUnit,
  zoneOptions,
  npcOptions,
  magicItemOptions,
  treasureOptions,
}: SceneListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SceneWithDetails | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function moveScene(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const result = await reorderScenes(
      adventureId,
      reordered.map((scene) => scene.id)
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
      await deleteSceneById(pendingDelete.id);
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
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("scene.list.title")}</h2>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("scene.list.addButton")}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-6 rounded-md border p-4">
          <SceneForm
            adventureId={adventureId}
            nextPosition={scenes.length + 1}
            zoneOptions={zoneOptions}
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      {scenes.length === 0 ? (
        <p>{t("scene.list.emptyMessage")}</p>
      ) : (
        <ul className="space-y-4">
          {scenes.map((scene, index) => (
            <li key={scene.id} className="rounded-md border p-4">
              {editingId === scene.id ? (
                <SceneForm
                  adventureId={adventureId}
                  nextPosition={scene.position}
                  zoneOptions={zoneOptions}
                  scene={scene}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <span className="mr-2 rounded-full border px-2 py-0.5 text-xs font-medium uppercase">
                        {t(`scene.kinds.${scene.kind}`)}
                      </span>
                      <span className="text-lg font-semibold">
                        {scene.title}
                      </span>
                      {scene.description && (
                        <p className="mt-1 text-sm whitespace-pre-line text-gray-700">
                          {scene.description}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-600">
                        {t("scene.fields.xpAward.label")}
                        {": "}
                        {scene.xpAward === null ? "—" : scene.xpAward}
                        {scene.grantsHeroPoint &&
                          ` · ${t("scene.fields.grantsHeroPoint.label")}`}
                      </p>
                      <p className="mt-1 text-sm">
                        {scene.zoneId !== null ? (
                          <Link
                            href={`/dashboard/geography?place=${scene.zoneId}`}
                            className="text-blue-600 underline"
                          >
                            {zoneName(zoneOptions, scene.zoneId) ??
                              t("scene.place.viewMap")}
                          </Link>
                        ) : (
                          <span className="text-gray-600">
                            {t("scene.place.unassigned")}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 max-w-[140px]">
                        <CheckOffControl
                          label={t("scene.checkOff.label")}
                          checked={scene.awarded}
                          onToggle={(next) => setSceneAwarded(scene.id, next)}
                          errorMessage={t("common.checkOff.failed")}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <BaseButton
                        onClick={() => void moveScene(index, -1)}
                        disabled={index === 0}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                        icon={IconType.chevronUp}
                        ariaLabel={t("scene.list.moveUp", {
                          title: scene.title,
                        })}
                      />
                      <BaseButton
                        onClick={() => void moveScene(index, 1)}
                        disabled={index === scenes.length - 1}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                        icon={IconType.chevronDown}
                        ariaLabel={t("scene.list.moveDown", {
                          title: scene.title,
                        })}
                      />
                      <BaseButton
                        onClick={() => setEditingId(scene.id)}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                      >
                        {t("common.table.edit")}
                      </BaseButton>
                      <BaseButton
                        onClick={() => setPendingDelete(scene)}
                        size={ButtonSize.small}
                        variant={ButtonVariant.danger}
                      >
                        {t("common.form.delete")}
                      </BaseButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t pt-3 md:grid-cols-2">
                    <SceneCreatureList
                      sceneId={scene.id}
                      creatures={scene.creatures}
                      npcOptions={npcOptions}
                    />
                    <LootList
                      sceneId={scene.id}
                      loot={scene.loot}
                      currencyUnit={currencyUnit}
                      magicItemOptions={magicItemOptions}
                      treasureOptions={treasureOptions}
                    />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
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
