"use client";

import { useTranslations } from "next-intl";

import useEncounterAdjustments from "@/app/lib/hooks/useEncounterAdjustments";
import Select from "@/app/ui/forms/inputs/Select";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

/** The largest party offered, unless the campaign's own is larger. */
const MAX_OFFERED = 10;

/**
 * The adventure page's number of characters (SPEC-031 §5.C.8): starts at
 * the campaign's number of players, and every fight on the page is priced
 * for it, under either system. Kept in this browser only, with a Reset.
 * Renders nothing outside `EncounterAdjustmentsProvider`.
 */
export default function PartySizeControl() {
  const t = useTranslations();
  const adjustments = useEncounterAdjustments();
  if (adjustments === null) return null;

  const { partySize, defaultPartySize, partySizeOverridden } = adjustments;
  const largest = Math.max(MAX_OFFERED, defaultPartySize, partySize);
  const options = Array.from({ length: largest }, (_, index) => ({
    value: index + 1,
    label: String(index + 1),
  }));

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-40">
        <Select
          label={t("adventure.partySize.label")}
          value={partySize}
          options={options}
          onChange={(value) => adjustments.setPartySize(Number(value))}
        />
      </div>
      {partySizeOverridden && (
        <BaseButton
          onClick={adjustments.resetPartySize}
          size={ButtonSize.small}
          variant={ButtonVariant.secondary}
        >
          {t("adventure.partySize.reset")}
        </BaseButton>
      )}
      <p className="text-sm text-gray-600">
        {t("adventure.partySize.defaultHint", { count: defaultPartySize })}
      </p>
    </div>
  );
}
