"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import reorderSceneCreatures from "@/app/lib/data/campaigns/reorderSceneCreatures";
import deleteSceneCreatureById from "@/app/lib/data/campaigns/deleteSceneCreatureById";
import setSceneCreatureAwarded from "@/app/lib/data/campaigns/setSceneCreatureAwarded";
import { SceneCreatureWithAdversary } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";
import { rowBattlePoints } from "@/app/lib/utils/daggerheart/battlePoints";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import useEncounterAdjustments, {
  type EncounterAdjustmentsApi,
} from "@/app/lib/hooks/useEncounterAdjustments";
import recordHref from "@/app/lib/utils/search/recordHref";
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
  /** SPEC-030: Daggerheart prices rows in Battle Points, not XP. */
  rulesSystem?: GameSystem;
  sceneId: number;
  creatures: SceneCreatureWithAdversary[];
  npcOptions: ResolvedOption<number>[];
  adversaryOptions?: ResolvedOption<number>[];
  partySize?: number;
  /**
   * SPEC-031: a fight's rows can be counted out, or counted more or fewer
   * times, on the fly — inside `EncounterAdjustmentsProvider` only.
   */
  isFight?: boolean;
}

/**
 * A scene's creature rows, in position order (SPEC-013 §5, T8). The XP
 * total is derived at render time as `xpEach * quantity`, never stored
 * (`SceneCreature`'s own comment). `awarded` is deliberately not shown
 * here — the check-off control is T9's. Outside the metadata layer
 * (ADR-0011), same shape as `AdventureLadder`.
 *
 * Under Daggerheart (SPEC-030 T3) a row shows its Battle Points instead, and
 * no check-off: its only effect is the XP found, which Daggerheart has none
 * of.
 *
 * SPEC-031: a 5e row shows its challenge rating; any row shows its
 * statistics link, opening in a new tab, and a row linked to an NPC links
 * to the NPC's page. The link is validated `http`/`https` on write and
 * rendered as a plain `href`, never as markup.
 *
 * In a fight, each row also has Exclude/Include and − / + on the count the
 * difficulty reads (SPEC-031 §5.C.9): browser-only, never the stored
 * quantity, which the row's XP total keeps showing. Battle Points read the
 * counted quantity and the page's party size.
 */
export default function SceneCreatureList({
  rulesSystem = "dnd5e",
  sceneId,
  creatures,
  npcOptions,
  adversaryOptions = [],
  partySize = 4,
  isFight = false,
}: SceneCreatureListProps) {
  const t = useTranslations();
  const isDaggerheart = rulesSystem === "daggerheart";
  const router = useRouter();
  // The dashboard the page is under, which an NPC's page link stays in.
  const dashboardSystem = useGameSystem();
  const adjustments = useEncounterAdjustments();
  const pricedPartySize = adjustments?.partySize ?? partySize;
  const canAdjust = isFight && adjustments !== null;

  function npcName(npcId: number) {
    return npcOptions.find((option) => option.value === npcId)?.label;
  }

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<SceneCreatureWithAdversary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function moveCreature(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= creatures.length) return;

    const reordered = [...creatures];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    try {
      const result = await reorderSceneCreatures(
        sceneId,
        reordered.map((creature) => creature.id)
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
            rulesSystem={rulesSystem}
            adversaryOptions={adversaryOptions}
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
                  rulesSystem={rulesSystem}
                  adversaryOptions={adversaryOptions}
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
                  {!isDaggerheart && creature.challengeRating && (
                    <span className="ml-2 whitespace-nowrap text-gray-600">
                      {t("sceneCreature.list.challengeRating")}{" "}
                      {creature.challengeRating}
                    </span>
                  )}
                  {isDaggerheart ? (
                    <span className="ml-2 text-gray-600">
                      {t("sceneCreature.list.battlePoints")}:{" "}
                      {rowBattlePoints(
                        {
                          ...creature,
                          quantity:
                            adjustments?.counted(creature).quantity ??
                            creature.quantity,
                        },
                        pricedPartySize
                      ) ?? t("sceneCreature.list.unpriced")}
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                  {canAdjust && (
                    <CountControls
                      creature={creature}
                      adjustments={adjustments}
                    />
                  )}
                  {(creature.statsUrl || creature.npcId !== null) && (
                    <div className="mt-1 flex flex-wrap gap-3">
                      {creature.statsUrl && (
                        <a
                          href={creature.statsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("sceneCreature.list.statsLinkLabel", {
                            name: creature.name,
                          })}
                          className="text-blue-600 hover:underline"
                        >
                          {t("sceneCreature.list.statsLink")}
                        </a>
                      )}
                      {creature.npcId !== null && (
                        <Link
                          href={recordHref(dashboardSystem, "npc", {
                            id: creature.npcId,
                            name: npcName(creature.npcId) ?? creature.name,
                          })}
                          aria-label={t("sceneCreature.list.npcLinkLabel", {
                            name: npcName(creature.npcId) ?? creature.name,
                          })}
                          className="text-blue-600 hover:underline"
                        >
                          {t("sceneCreature.list.npcLink")}
                        </Link>
                      )}
                    </div>
                  )}
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

interface CountControlsProps {
  creature: SceneCreatureWithAdversary;
  adjustments: EncounterAdjustmentsApi;
}

/** A fight row's on-the-fly count: Exclude/Include and − / + (SPEC-031 §5.C.9). */
function CountControls({ creature, adjustments }: CountControlsProps) {
  const t = useTranslations();
  const { excluded, quantity } = adjustments.counted(creature);
  const name = creature.name;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <BaseButton
        onClick={() => adjustments.setExcluded(creature, !excluded)}
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
        ariaLabel={t(
          excluded
            ? "sceneCreature.adjust.includeLabel"
            : "sceneCreature.adjust.excludeLabel",
          { name }
        )}
      >
        {t(
          excluded
            ? "sceneCreature.adjust.include"
            : "sceneCreature.adjust.exclude"
        )}
      </BaseButton>
      {!excluded && (
        <>
          <BaseButton
            onClick={() =>
              adjustments.setCountedQuantity(creature, quantity - 1)
            }
            disabled={quantity <= 1}
            size={ButtonSize.small}
            variant={ButtonVariant.secondary}
            ariaLabel={t("sceneCreature.adjust.decreaseLabel", { name })}
          >
            −
          </BaseButton>
          <BaseButton
            onClick={() =>
              adjustments.setCountedQuantity(creature, quantity + 1)
            }
            size={ButtonSize.small}
            variant={ButtonVariant.secondary}
            ariaLabel={t("sceneCreature.adjust.increaseLabel", { name })}
          >
            +
          </BaseButton>
        </>
      )}
      {excluded ? (
        <span className="text-amber-800">
          {t("sceneCreature.adjust.excluded")}
        </span>
      ) : (
        quantity !== creature.quantity && (
          <span className="text-amber-800">
            {t("sceneCreature.adjust.counted", {
              counted: quantity,
              stored: creature.quantity,
            })}
          </span>
        )
      )}
    </div>
  );
}
