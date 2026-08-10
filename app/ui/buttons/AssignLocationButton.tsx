"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import BaseButton from "./BaseButton";
import ButtonSize from "./BaseButton/ButtonSize";
import ButtonVariant from "./BaseButton/ButtonVariant";
import AssignLocationModal from "@/app/ui/components/AssignLocationModal";
import assignNpcLocation from "@/app/lib/data/npc/assignLocation";
import assignDeityLocation from "@/app/lib/data/deities/assignLocation";
import PageType from "@/app/lib/definitions/types/PageType";
import type AssignLocationInput from "@/app/lib/definitions/interfaces/maps/AssignLocationInput";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";

type LocatableEntityPageType = PageType.Npc | PageType.Deity;

const ASSIGN_ACTIONS: Record<
  LocatableEntityPageType,
  (input: AssignLocationInput) => Promise<MutationResult>
> = {
  [PageType.Npc]: assignNpcLocation,
  [PageType.Deity]: assignDeityLocation,
};

interface AssignLocationButtonProps {
  pageType: LocatableEntityPageType;
  entityId: number;
  currentZoneId: number | null;
  currentPoiId: number | null;
  currentLocationLabel: string;
  /**
   * `"button"` (default) is the admin list's row action, labelled
   * "Posiziona"/"Place". `"text"` is the card's own trigger (SPEC-007 T3) —
   * `currentLocationLabel` itself becomes the clickable element, so a card
   * showing "Sconosciuta" or a place name opens the same modal, the same
   * action, with no second implementation.
   */
  variant?: "button" | "text";
}

/**
 * The admin list's per-row entry point into the assignment modal (SPEC-008
 * T5) — the other entry point is the map (SPEC-008 §5), which pre-fills the
 * Zone from whatever is currently in view instead of from a fetched
 * summary, but calls the exact same `assignAction`. The card's own entry
 * point (SPEC-007 T3) is a third, `variant="text"`.
 */
export default function AssignLocationButton({
  pageType,
  entityId,
  currentZoneId,
  currentPoiId,
  currentLocationLabel,
  variant = "button",
}: AssignLocationButtonProps) {
  const t = useTranslations("common.table");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "text" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-left hover:underline"
        >
          {currentLocationLabel}
        </button>
      ) : (
        <BaseButton
          onClick={() => setIsOpen(true)}
          size={ButtonSize.small}
          variant={ButtonVariant.secondary}
        >
          {t("assignLocation")}
        </BaseButton>
      )}
      <AssignLocationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        entityId={entityId}
        currentZoneId={currentZoneId}
        currentPoiId={currentPoiId}
        currentLocationLabel={currentLocationLabel}
        assignAction={ASSIGN_ACTIONS[pageType]}
        onAssigned={() => router.refresh()}
      />
    </>
  );
}
