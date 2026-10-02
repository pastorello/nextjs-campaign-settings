"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

import encounterDifficulty, {
  type XpRow,
} from "@/app/lib/utils/dnd5e/encounterDifficulty";

interface EncounterSummaryProps {
  /** The counted rows: excluded ones out, each quantity the counted one. */
  creatures: readonly XpRow[];
  partySize: number;
  /** The adventure's target level; clamped to 1–20 for the budget. */
  targetLevel: number;
}

/**
 * A 5e fight's difficulty (SPEC-031 §5.B): its XP against the party's
 * three SRD 5.2.1 budgets, and the band it falls in. Computed at render
 * time, so the on-the-fly party size and counts recompute it with nothing
 * stored. Rows with no XP are counted apart, never as zero — the same
 * rule as `BattlePointsSummary`.
 */
export default function EncounterSummary({
  creatures,
  partySize,
  targetLevel,
}: EncounterSummaryProps) {
  const t = useTranslations();
  const { xp, unpriced, budgets, band } = encounterDifficulty(
    creatures,
    partySize,
    targetLevel
  );

  return (
    <div className="mt-1 space-y-0.5 text-sm">
      <p className="text-gray-700">
        {t("scene.encounter.summary", { xp, ...budgets })}
      </p>
      <p
        className={clsx("font-medium", {
          "text-red-700": band === "aboveHigh",
          "text-gray-800": band !== "aboveHigh",
        })}
      >
        {band === null
          ? t("scene.encounter.noBand")
          : t("scene.encounter.difficulty", {
              band: t(`scene.encounter.bands.${band}`),
            })}
      </p>
      {unpriced > 0 && (
        <p className="text-gray-600">
          {t("scene.encounter.unpriced", { count: unpriced })}
        </p>
      )}
    </div>
  );
}
