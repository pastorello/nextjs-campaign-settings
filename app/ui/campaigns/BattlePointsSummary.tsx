"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

import {
  BattlePointRow,
  battlePointBudget,
  knownAdjustments,
  sceneBattlePoints,
  suggestsLowerTier,
} from "@/app/lib/utils/daggerheart/battlePoints";

interface BattlePointsSummaryProps {
  creatures: readonly BattlePointRow[];
  partySize: number;
  adventureTier: number;
  /** The scene's ticked adjustments (`scene.battleAdjustments`). */
  adjustments: readonly string[];
}

/**
 * A Daggerheart fight's Battle Points, spent against its budget (SPEC-030
 * §5, T3). Computed at render time from the rows' adversaries, the party
 * size and the ticked adjustments, so a changed party size recomputes it
 * with nothing stored. Unpriced rows are counted, not priced at zero, and
 * the lower-tier adjustment is suggested, never ticked.
 */
export default function BattlePointsSummary({
  creatures,
  partySize,
  adventureTier,
  adjustments,
}: BattlePointsSummaryProps) {
  const t = useTranslations();
  const { spent, unpriced } = sceneBattlePoints(creatures, partySize);
  const budget = battlePointBudget(partySize, adjustments);
  const ticked = knownAdjustments(adjustments);

  return (
    <div className="mt-1 space-y-0.5 text-sm">
      <p
        className={clsx("font-medium", {
          "text-red-700": spent > budget,
          "text-gray-700": spent <= budget,
        })}
      >
        {t("scene.battlePoints.summary", { spent, budget })}
        {spent > budget &&
          ` · ${t("scene.battlePoints.over", { points: spent - budget })}`}
      </p>
      {ticked.length > 0 && (
        <p className="text-gray-600">
          {ticked
            .map((adjustment) =>
              t(`daggerheart.battleAdjustments.${adjustment}`)
            )
            .join(" · ")}
        </p>
      )}
      {unpriced > 0 && (
        <p className="text-gray-600">
          {t("scene.battlePoints.unpriced", { count: unpriced })}
        </p>
      )}
      {suggestsLowerTier(creatures, adventureTier, adjustments) && (
        <p className="text-amber-800">
          {t("scene.battlePoints.lowerTierSuggestion")}
        </p>
      )}
    </div>
  );
}
