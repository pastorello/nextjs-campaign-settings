"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import reorderSceneCreatures from "@/app/lib/data/campaigns/reorderSceneCreatures";
import deleteSceneCreatureById from "@/app/lib/data/campaigns/deleteSceneCreatureById";
import setSceneCreatureAwarded from "@/app/lib/data/campaigns/setSceneCreatureAwarded";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";

import SceneCreatureForm from "./SceneCreatureForm";
import CheckOffControl from "./CheckOffControl";

interface SceneCreatureListProps {
  sceneId: number;
  creatures: SceneCreature[];
  npcOptions: ResolvedOption<number>[];
}

/**
 * A scene's creature rows, in position order (SPEC-013 §5, T8). The XP
 * total is derived at render time as `xpEach * quantity`, never stored
 * (`SceneCreature`'s own comment). `awarded` is deliberately not shown
 * here — the check-off control is T9's. Outside the metadata layer
 * (ADR-0011), same shape as `AdventureLadder`.
 */
export default function SceneCreatureList({
  sceneId,
  creatures,
  npcOptions,
}: SceneCreatureListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SceneCreature | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function moveCreature(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= creatures.length) return;

    const reordered = [...creatures];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const result = await reorderSceneCreatures(
      sceneId,
      reordered.map((creature) => creature.id)
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
      await deleteSceneCreatureById(pendingDelete.id);
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {t("sceneCreature.list.title")}
        </h4>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("sceneCreature.list.addButton")}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-3 rounded-md border p-3">
          <SceneCreatureForm
            sceneId={sceneId}
            nextPosition={creatures.length + 1}
            npcOptions={npcOptions}
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      {creatures.length === 0 ? (
        <p className="text-sm text-gray-600">
          {t("sceneCreature.list.emptyMessage")}
        </p>
      ) : (
        <ul className="space-y-2">
          {creatures.map((creature, index) =>
            editingId === creature.id ? (
              <li key={creature.id} className="rounded-md border p-3">
                <SceneCreatureForm
                  sceneId={sceneId}
                  nextPosition={creature.position}
                  npcOptions={npcOptions}
                  creature={creature}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={creature.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex-1">
                  <span className="font-medium">{creature.name}</span>
                  <span className="ml-2 text-gray-600">
                    ×{creature.quantity}
                  </span>
                  <span className="ml-2 text-gray-600">
                    {t("sceneCreature.list.xpTotal")}:{" "}
                    {creature.xpEach === null
                      ? "—"
                      : creature.xpEach * creature.quantity}
                  </span>
                  <div className="mt-1 max-w-[120px]">
                    <CheckOffControl
                      label={t("sceneCreature.checkOff.label")}
                      checked={creature.awarded}
                      onToggle={(next) =>
                        setSceneCreatureAwarded(creature.id, next)
                      }
                      errorMessage={t("common.checkOff.failed")}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <BaseButton
                    onClick={() => void moveCreature(index, -1)}
                    disabled={index === 0}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                    icon={IconType.chevronUp}
                    ariaLabel={t("sceneCreature.list.moveUp", {
                      name: creature.name,
                    })}
                  />
                  <BaseButton
                    onClick={() => void moveCreature(index, 1)}
                    disabled={index === creatures.length - 1}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                    icon={IconType.chevronDown}
                    ariaLabel={t("sceneCreature.list.moveDown", {
                      name: creature.name,
                    })}
                  />
                  <BaseButton
                    onClick={() => setEditingId(creature.id)}
                    size={ButtonSize.small}
                    variant={ButtonVariant.secondary}
                  >
                    {t("common.table.edit")}
                  </BaseButton>
                  <BaseButton
                    onClick={() => setPendingDelete(creature)}
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
