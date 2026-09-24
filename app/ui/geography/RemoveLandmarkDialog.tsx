"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import RemovalOutcome from "@/app/lib/definitions/types/RemovalOutcome";
import Modal from "@/app/ui/components/Modal";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import RemovalOutcomeChoices from "@/app/ui/geography/RemovalOutcomeChoices";

interface RemoveLandmarkDialogProps {
  landmarkTitle: string;
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
 * **No counts, deliberately** (§5's landmark paragraph): a landmark has no
 * children to reparent, so the figures `RemovePlaceDialog` fetches have no
 * landmark equivalent to fetch. The entities attached to one are a real
 * question this dialog does not answer, and cannot honestly answer today —
 * `npc.poiId`/`deities.poiId` are `onDelete: Restrict`, so deleting a
 * landmark somebody is standing at fails in the database rather than
 * detaching them (TD-147). Stating a count here would promise an outcome
 * the mutation does not deliver.
 *
 * Both outcomes are the caller's to perform, as they were when they were
 * two buttons: the mutations live in `usePOIManager`, which owns the
 * marker and the client-id mapping. This component only asks.
 */
export default function RemoveLandmarkDialog({
  landmarkTitle,
  isOpen,
  onClose,
  onUnplace,
  onDelete,
}: RemoveLandmarkDialogProps) {
  const t = useTranslations("geography.removeLandmark");
  const [outcome, setOutcome] = useState<RemovalOutcome | null>(null);

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
              <p>{t("outcomes.deleteSummary", { title: landmarkTitle })}</p>
            ),
          },
        ]}
      />

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
            outcome === null ? ButtonState.Disabled : ButtonState.Default
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
