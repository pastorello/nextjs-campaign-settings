"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import fetchPlaceDeletionImpact from "@/app/lib/data/maps/fetchPlaceDeletionImpact";
import deletePlace from "@/app/lib/data/maps/deletePlace";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import type PlaceDeletionImpact from "@/app/lib/definitions/interfaces/maps/PlaceDeletionImpact";
import Modal from "@/app/ui/components/Modal";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface DeletePlaceButtonProps {
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
  /** The place was deleted; the caller should navigate off it. */
  onDeleted: () => void;
}

/**
 * Deletes the place currently being viewed (SPEC-010 T3). Sits on `WorldMap`
 * alongside `MapUploadControl`/`AttachEntityButton`/`DrawAreaButton` — the
 * map's own entry point for an action on the current place itself.
 *
 * Counts are fetched fresh the moment the dialog opens (§7: "at the moment
 * of asking"), not baked into a generic confirm — a place delete does not
 * refuse on having children or entities the way SPEC-006's faction delete
 * does, it proceeds, so the only safeguard is showing exactly what moves and
 * what loses its location before the DM confirms.
 */
export default function DeletePlaceButton({
  placeId,
  placeTitle,
  parentTitle,
  isRoot,
  onDeleted,
}: DeletePlaceButtonProps) {
  const t = useTranslations("geography.deletePlace");
  const [isOpen, setIsOpen] = useState(false);
  const [impact, setImpact] = useState<PlaceDeletionImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isRoot) {
    return null;
  }

  const openDialog = () => {
    setIsOpen(true);
    setIsLoadingImpact(true);
    void (async () => {
      try {
        setImpact(await fetchPlaceDeletionImpact(placeId));
      } catch (error) {
        console.error("Failed to load the place's deletion impact:", error);
        notifyError(t("errors.loadImpactFailed"));
        setIsOpen(false);
      } finally {
        setIsLoadingImpact(false);
      }
    })();
  };

  const closeDialog = () => {
    setIsOpen(false);
    setImpact(null);
  };

  const handleConfirm = async () => {
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

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        onClick={openDialog}
        className="rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 shadow-md hover:bg-red-50 dark:hover:bg-red-900/30"
      >
        {t("trigger")}
      </button>

      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={t("confirmTitle", { title: placeTitle })}
        size="small"
      >
        {isLoadingImpact ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("loading")}
          </p>
        ) : (
          impact !== null && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {!hasImpact && <p>{t("noImpact")}</p>}
              {impact.placeCount > 0 && (
                <p>
                  {t("placesImpact", {
                    count: impact.placeCount,
                    parentTitle,
                  })}
                </p>
              )}
              {impact.npcCount > 0 && (
                <p>{t("npcsImpact", { count: impact.npcCount })}</p>
              )}
              {impact.deityCount > 0 && (
                <p>{t("deitiesImpact", { count: impact.deityCount })}</p>
              )}
            </div>
          )
        )}

        <div className="flex justify-end gap-2 pt-2">
          <BaseButton variant={ButtonVariant.neutral} onClick={closeDialog}>
            {t("cancel")}
          </BaseButton>
          <BaseButton
            variant={ButtonVariant.danger}
            buttonState={
              isSubmitting || isLoadingImpact
                ? ButtonState.Loading
                : ButtonState.Default
            }
            onClick={() => void handleConfirm()}
          >
            {t("confirm")}
          </BaseButton>
        </div>
      </Modal>
    </div>
  );
}
