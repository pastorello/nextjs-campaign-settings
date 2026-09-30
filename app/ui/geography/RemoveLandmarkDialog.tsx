"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import fetchLandmarkDeletionImpact from "@/app/lib/data/maps/fetchLandmarkDeletionImpact";
import { notifyError } from "@/app/lib/notifications/notify";
import type LandmarkDeletionImpact from "@/app/lib/definitions/interfaces/maps/LandmarkDeletionImpact";
import RemovalOutcome from "@/app/lib/definitions/types/RemovalOutcome";
import Modal from "@/app/ui/components/Modal";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import RemovalOutcomeChoices from "@/app/ui/geography/RemovalOutcomeChoices";

interface RemoveLandmarkDialogProps {
  /** The landmark's database id — what the counts are read for. */
  landmarkId: number;
  landmarkTitle: string;
  /** The place enclosing the landmark — where its characters stay. */
  parentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  /** "Rimuovi dalla mappa" — SPEC-017 T10's `unplaceLandmark`. */
  onUnplace: () => void;
  /** "Elimina definitivamente" — `usePOIManager.deletePOI`. */
  onDelete: () => void;
}

/**
 * SPEC-023's one question, worded for a landmark: the same two named
 * outcomes a place gets, on the other table. Replaces the pair of popover
 * entries T7 and SPEC-017 T10 left side by side, and absorbs TD-140's
 * bare confirmation — which asked "are you sure?" about one of the two
 * without ever mentioning the other.
 *
 * **One count, not three.** A landmark has no children to reparent, so of
 * the figures `RemovePlaceDialog` fetches only the characters apply. Since
 * TD-147, `deletePoi` detaches them from the landmark and leaves them in
 * its enclosing place, so the delete outcome says how many stay there —
 * fetched fresh the moment the dialog opens (`fetchLandmarkDeletionImpact`),
 * as the place dialog does, and nothing is confirmable until it arrives.
 * The un-place outcome needs no figure: its summary already says the
 * characters stay attached.
 *
 * Both outcomes are the caller's to perform, as they were when they were
 * two buttons: the mutations live in `usePOIManager`, which owns the
 * marker and the client-id mapping. This component only asks.
 */
export default function RemoveLandmarkDialog({
  landmarkId,
  landmarkTitle,
  parentTitle,
  isOpen,
  onClose,
  onUnplace,
  onDelete,
}: RemoveLandmarkDialogProps) {
  const t = useTranslations("geography.removeLandmark");
  const [outcome, setOutcome] = useState<RemovalOutcome | null>(null);
  const [impact, setImpact] = useState<LandmarkDeletionImpact | null>(null);

  // Same shape as `RemovePlaceDialog`'s effect, for the same reasons: one
  // fetch per open, `setState` only inside the async helper, and a
  // cancelled flag so a close mid-fetch never writes into a closed dialog.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadImpact = async () => {
      // Cleared on open rather than on close: a closed dialog renders
      // nothing, and a re-open must not confirm against the last counts.
      setImpact(null);
      try {
        const result = await fetchLandmarkDeletionImpact(landmarkId);
        if (!cancelled) setImpact(result);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load the landmark's deletion impact:", error);
        notifyError(t("errors.loadImpactFailed"));
        onClose();
      }
    };

    void loadImpact();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t`/`onClose`/`landmarkId` intentionally excluded: this effect must run exactly once per open, not re-run because a parent re-render gave it a new function reference.
  }, [isOpen]);

  const closeDialog = () => {
    onClose();
    setOutcome(null);
  };

  const handleConfirm = () => {
    if (outcome === null) return;
    closeDialog();
    if (outcome === RemovalOutcome.unplace) onUnplace();
    else onDelete();
  };

  const isLoadingImpact = isOpen && impact === null;

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) closeDialog();
      }}
      title={t("title", { title: landmarkTitle })}
      description={t("description")}
      size="small"
    >
      {impact === null ? (
        <p className="text-sm text-gray-600">{t("loading")}</p>
      ) : (
        <RemovalOutcomeChoices
          name="remove-landmark-outcome"
          legend={t("legend")}
          value={outcome}
          onChange={setOutcome}
          options={[
            {
              outcome: RemovalOutcome.unplace,
              label: t("outcomes.unplaceLabel"),
              detail: (
                <p>{t("outcomes.unplaceSummary", { title: landmarkTitle })}</p>
              ),
            },
            {
              outcome: RemovalOutcome.delete,
              label: t("outcomes.deleteLabel"),
              isDestructive: true,
              detail: (
                <>
                  <p>{t("outcomes.deleteSummary", { title: landmarkTitle })}</p>
                  {impact.npcCount + impact.deityCount === 0 && (
                    <p>{t("outcomes.deleteNoEntities")}</p>
                  )}
                  {impact.npcCount > 0 && (
                    <p>
                      {t("outcomes.deleteNpcs", {
                        count: impact.npcCount,
                        parentTitle,
                      })}
                    </p>
                  )}
                  {impact.deityCount > 0 && (
                    <p>
                      {t("outcomes.deleteDeities", {
                        count: impact.deityCount,
                        parentTitle,
                      })}
                    </p>
                  )}
                </>
              ),
            },
          ]}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <BaseButton variant={ButtonVariant.neutral} onClick={closeDialog}>
          {t("cancel")}
        </BaseButton>
        <BaseButton
          variant={
            outcome === RemovalOutcome.delete
              ? ButtonVariant.danger
              : ButtonVariant.primary
          }
          buttonState={
            isLoadingImpact
              ? ButtonState.Loading
              : outcome === null
                ? ButtonState.Disabled
                : ButtonState.Default
          }
          onClick={handleConfirm}
        >
          {outcome === RemovalOutcome.unplace
            ? t("confirmUnplace")
            : t("confirm")}
        </BaseButton>
      </div>
    </Modal>
  );
}
