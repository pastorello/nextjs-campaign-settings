"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import fetchPlaceDeletionImpact from "@/app/lib/data/maps/fetchPlaceDeletionImpact";
import deletePlace from "@/app/lib/data/maps/deletePlace";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import type PlaceDeletionImpact from "@/app/lib/definitions/interfaces/maps/PlaceDeletionImpact";
import RemovalOutcome from "@/app/lib/definitions/types/RemovalOutcome";
import Modal from "@/app/ui/components/Modal";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import RemovalOutcomeChoices from "@/app/ui/geography/RemovalOutcomeChoices";

interface RemovePlaceDialogProps {
  placeId: number;
  placeTitle: string;
  /** Where direct children/landmarks reparent to — named in the dialog. */
  parentTitle: string;
  /**
   * The root — the one zone with `parentId: null` (rule 1, §5) — is never
   * deletable, and the control is not rendered for it at all, rather than
   * rendered and then refusing (§5 edge cases).
   */
  isRoot: boolean;
  /**
   * Externally controlled (usability fix, 2026-08-17): this used to be a
   * floating trigger button in its own map corner; the trigger now lives
   * in `MapOptionsButton`'s menu, and this component renders only the
   * confirmation dialog.
   */
  isOpen: boolean;
  onClose: () => void;
  /** The place was deleted; the caller should navigate off it. */
  onDeleted: () => void;
  /**
   * "Rimuovi dalla mappa" (SPEC-023 §5) — when given, the dialog asks
   * *which* removal the DM means instead of only confirming a delete, and
   * calls this back for the non-destructive answer. The un-place mutation
   * itself stays the caller's, the same split `onDeleted` uses.
   *
   * Absent is not "this place cannot be un-placed": it is a caller with no
   * un-place to offer at this moment — the map's own "Elimina questa mappa"
   * entry acts on the place you are standing inside, which has no marker
   * on this map to take off it, and §5's edge case for a place already in
   * the unpositioned pool asks for the same single-outcome dialog.
   */
  onUnplace?: () => void;
}

/**
 * The one question SPEC-023 asks when a place is removed — "off this map,
 * or gone for good?" — and, where only one of those is on offer, the
 * SPEC-010 delete confirmation it grew out of.
 *
 * Two outcomes, named (§5.2), never a checkbox modifying a delete:
 * **Rimuovi dalla mappa** hands back to `onUnplace` (SPEC-017's pool,
 * unchanged), **Elimina definitivamente** runs SPEC-010's `deletePlace`.
 * The DM chose option A on 2026-09-24, so "definitivamente" still means
 * rule 2 — this place goes, its children move up to the grandparent and
 * lose their position — not a cascade; the counts say so in as many words
 * before either outcome is taken.
 *
 * Counts are fetched fresh the moment the dialog opens (§7: "at the moment
 * of asking"), not baked into a generic confirm — a place delete does not
 * refuse on having children or entities the way SPEC-006's faction delete
 * does, it proceeds, so the only safeguard is showing exactly what moves and
 * what loses its location before the DM confirms. One fetch serves both
 * outcomes: the same figures that say what a delete scatters say what an
 * un-place keeps.
 */
export default function RemovePlaceDialog({
  placeId,
  placeTitle,
  parentTitle,
  isRoot,
  isOpen,
  onClose,
  onDeleted,
  onUnplace,
}: RemovePlaceDialogProps) {
  const t = useTranslations("geography.removePlace");
  const [impact, setImpact] = useState<PlaceDeletionImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chosenOutcome, setChosenOutcome] = useState<RemovalOutcome | null>(
    null
  );

  // Fetches fresh the moment the dialog opens (§7: "at the moment of
  // asking") — previously triggered by this component's own click handler
  // on its floating button; now the button lives elsewhere, so the fetch is
  // keyed on the `isOpen` prop transitioning to true instead. The `setState`
  // calls live inside `loadImpact`, an async function invoked from the
  // effect rather than run directly in its body — same shape
  // `AttachEntityButton`'s own entity-type effect uses, since a synchronous
  // `setState` at the top of an effect body trips `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (!isOpen || isRoot) return;

    let cancelled = false;

    const loadImpact = async () => {
      setIsLoadingImpact(true);
      try {
        const result = await fetchPlaceDeletionImpact(placeId);
        if (!cancelled) setImpact(result);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load the place's deletion impact:", error);
        notifyError(t("errors.loadImpactFailed"));
        onClose();
      } finally {
        if (!cancelled) setIsLoadingImpact(false);
      }
    };

    void loadImpact();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t`/`onClose`/`placeId` intentionally excluded: this effect must run exactly once per open, not re-run because a parent re-render gave it a new function reference.
  }, [isOpen, isRoot]);

  if (isRoot) {
    return null;
  }

  // Only one outcome to offer: the dialog is the delete confirmation it has
  // always been, with that outcome already chosen rather than a one-item
  // radio group asking the DM to pick it.
  const offersChoice = onUnplace !== undefined;
  const outcome = offersChoice ? chosenOutcome : RemovalOutcome.delete;

  const closeDialog = () => {
    onClose();
    setImpact(null);
    setChosenOutcome(null);
  };

  const handleConfirm = async () => {
    if (outcome === RemovalOutcome.unplace) {
      // Nothing to await: the mutation, the refetch that drops this
      // place's marker and closing the popover are all the caller's, the
      // same split `onDeleted` has always used.
      closeDialog();
      onUnplace?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await deletePlace(placeId);
      notifySuccess(t("success", { title: placeTitle }));
      closeDialog();
      onDeleted();
    } catch (error) {
      console.error("Failed to delete the place:", error);
      notifyError(t("errors.deleteFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasImpact =
    impact !== null &&
    (impact.placeCount > 0 || impact.npcCount > 0 || impact.deityCount > 0);

  // What "elimina definitivamente" costs (SPEC-010 rule 2/3) — the dialog's
  // whole body when there is nothing else on offer, and the destructive
  // outcome's detail when there is.
  const deleteImpact = impact !== null && (
    <>
      {!hasImpact && <p>{t("noImpact")}</p>}
      {impact.placeCount > 0 && (
        <p>{t("placesImpact", { count: impact.placeCount, parentTitle })}</p>
      )}
      {impact.npcCount > 0 && (
        <p>{t("npcsImpact", { count: impact.npcCount })}</p>
      )}
      {impact.deityCount > 0 && (
        <p>{t("deitiesImpact", { count: impact.deityCount })}</p>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) closeDialog();
      }}
      title={
        offersChoice
          ? t("chooseTitle", { title: placeTitle })
          : t("confirmTitle", { title: placeTitle })
      }
      description={
        offersChoice ? t("chooseDescription") : t("confirmDescription")
      }
      size="small"
    >
      {isLoadingImpact ? (
        <p className="text-sm text-gray-600">{t("loading")}</p>
      ) : (
        impact !== null &&
        (offersChoice ? (
          <RemovalOutcomeChoices
            name="remove-place-outcome"
            legend={t("chooseLegend")}
            value={chosenOutcome}
            onChange={setChosenOutcome}
            options={[
              {
                outcome: RemovalOutcome.unplace,
                label: t("outcomes.unplaceLabel"),
                detail: (
                  <>
                    <p>{t("outcomes.unplaceSummary", { title: placeTitle })}</p>
                    {/* The same `placeCount` the delete outcome scatters,
                        read the other way round: un-placing takes this
                        place off the map and leaves everything inside it
                        exactly where it is, on its own map. */}
                    <p>
                      {t("outcomes.unplaceKeeps", { count: impact.placeCount })}
                    </p>
                    {impact.npcCount + impact.deityCount > 0 && (
                      <p>{t("outcomes.unplaceEntities")}</p>
                    )}
                  </>
                ),
              },
              {
                outcome: RemovalOutcome.delete,
                label: t("outcomes.deleteLabel"),
                isDestructive: true,
                detail: (
                  <>
                    <p>{t("outcomes.deleteSummary", { title: placeTitle })}</p>
                    {deleteImpact}
                  </>
                ),
              },
            ]}
          />
        ) : (
          <div className="space-y-2 text-sm text-gray-600">{deleteImpact}</div>
        ))
      )}

      <div className="flex justify-end gap-2 pt-2">
        <BaseButton variant={ButtonVariant.neutral} onClick={closeDialog}>
          {t("cancel")}
        </BaseButton>
        <BaseButton
          variant={
            outcome === RemovalOutcome.unplace
              ? ButtonVariant.primary
              : ButtonVariant.danger
          }
          buttonState={
            isSubmitting || isLoadingImpact
              ? ButtonState.Loading
              : // Nothing is preselected (§5.2), so there is nothing to
                // confirm until the DM has answered the question.
                outcome === null
                ? ButtonState.Disabled
                : ButtonState.Default
          }
          onClick={() => void handleConfirm()}
        >
          {outcome === RemovalOutcome.unplace
            ? t("confirmUnplace")
            : t("confirm")}
        </BaseButton>
      </div>
    </Modal>
  );
}
