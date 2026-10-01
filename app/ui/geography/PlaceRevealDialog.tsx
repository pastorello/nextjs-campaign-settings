"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import fetchPlaceReveals from "@/app/lib/data/visibility/fetchPlaceReveals";
import setPlaceReveal from "@/app/lib/data/visibility/setPlaceReveal";
import type { PlaceKind } from "@/app/lib/data/visibility/placeTree";
import type PlaceReveals from "@/app/lib/definitions/interfaces/maps/PlaceReveals";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import Modal from "@/app/ui/components/Modal";

/**
 * Which campaigns see a place (SPEC-022 T6b), opened from the place popover
 * for a zone or a landmark. One checkbox per campaign, each its own write.
 * Under a campaign whose players still cannot see the place, the ancestor
 * that hides it is named, since a revealed child of a hidden parent stays
 * hidden (inheritance, §5). The reveals are read fresh each time it opens.
 */
export default function PlaceRevealDialog({
  kind,
  placeId,
  title,
  isOpen,
  onClose,
}: {
  kind: PlaceKind;
  placeId: number;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("geography.revealDialog");
  const tRoot = useTranslations();
  const [reveals, setReveals] = useState<PlaceReveals | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  // Bumped after each write, so the effect re-reads the reveals and their
  // hints without blanking the list first.
  const [version, setVersion] = useState(0);

  // The shape of `RemoveLandmarkDialog`'s effect: `setState` only inside the
  // async helper, and a cancelled flag, so that a close mid-fetch never
  // writes into a closed dialog.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const load = async () => {
      try {
        const result = await fetchPlaceReveals({ kind, id: placeId });
        if (!cancelled) setReveals(result);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to read a place's reveals:", error);
        notifyError(t("failed"));
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` intentionally excluded: a parent re-render's new translator must not re-read the reveals.
  }, [isOpen, kind, placeId, version]);

  const toggle = async (
    campaignId: number,
    campaign: string,
    revealed: boolean
  ) => {
    setBusyId(campaignId);
    // Ticked at once; a refused or failed write is undone by the re-read
    // in `finally`, which also refreshes the hints.
    setReveals((current) =>
      current === null
        ? current
        : {
            campaigns: current.campaigns.map((row) =>
              row.id === campaignId ? { ...row, revealed } : row
            ),
          }
    );
    try {
      const result = await setPlaceReveal({
        kind,
        id: placeId,
        campaignId,
        revealed,
      });
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ?? t("failed")
        );
        return;
      }
      notifySuccess(t(revealed ? "revealed" : "hidden", { campaign }));
    } catch (error) {
      console.error("Failed to change a place's reveal:", error);
      notifyError(t("failed"));
    } finally {
      setBusyId(null);
      setVersion((current) => current + 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) onClose();
      }}
      title={t("title", { title })}
      description={t("intro")}
      size="small"
    >
      {reveals === null ? (
        <p className="text-sm text-gray-600">{t("loading")}</p>
      ) : reveals.campaigns.length === 0 ? (
        <p className="text-sm text-gray-600">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reveals.campaigns.map((campaign) => (
            <li key={campaign.id} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={campaign.revealed}
                  disabled={busyId !== null}
                  onChange={(event) =>
                    void toggle(
                      campaign.id,
                      campaign.title,
                      event.target.checked
                    )
                  }
                />
                {campaign.title}
              </label>
              {campaign.revealed && campaign.hiddenBy !== null && (
                <p className="ml-6 text-xs text-amber-800">
                  {t("hiddenBy", { place: campaign.hiddenBy })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <BaseButton variant={ButtonVariant.neutral} onClick={onClose}>
          {t("close")}
        </BaseButton>
      </div>
    </Modal>
  );
}
