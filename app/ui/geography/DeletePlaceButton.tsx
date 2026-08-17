"use client";

import { useEffect, useState } from "react";
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
}

/**
 * Deletes the place currently being viewed (SPEC-010 T3) — reachable via
 * `MapOptionsButton`'s menu, the map's own entry point for an action on the
 * current place itself.
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
  isOpen,
  onClose,
  onDeleted,
}: DeletePlaceButtonProps) {
  const t = useTranslations("geography.deletePlace");
  const [impact, setImpact] = useState<PlaceDeletionImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const closeDialog = () => {
    onClose();
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
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) closeDialog();
      }}
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
  );
}
