import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import DhBattleAdjustment from "@/app/lib/definitions/enums/daggerheart/DhBattleAdjustment";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/*
 * Daggerheart's encounter budget (`daggerheart.md` §5), as data: what each
 * adversary type costs and what each adjustment adds. SPEC-030 §9 decision
 * 1 (the DM's, 2026-09-30) made Battle Points computed for Daggerheart; the
 * numbers are the game's, restated in the domain notes, not authored.
 */

/** Battle Points per adversary, by type; a Minion's is per party-sized group. */
export const DH_ADVERSARY_TYPE_COST: Record<DhAdversaryType, number> = {
  [DhAdversaryType.Minion]: 1,
  [DhAdversaryType.Social]: 1,
  [DhAdversaryType.Support]: 1,
  [DhAdversaryType.Horde]: 2,
  [DhAdversaryType.Ranged]: 2,
  [DhAdversaryType.Skulk]: 2,
  [DhAdversaryType.Standard]: 2,
  [DhAdversaryType.Leader]: 3,
  [DhAdversaryType.Bruiser]: 4,
  [DhAdversaryType.Solo]: 5,
};

/** What each adjustment adds to the budget. */
export const DH_BATTLE_ADJUSTMENT_POINTS: Record<DhBattleAdjustment, number> = {
  [DhBattleAdjustment.EasierOrShorter]: -1,
  [DhBattleAdjustment.TwoOrMoreSolos]: -2,
  [DhBattleAdjustment.BoostedDamage]: -2,
  [DhBattleAdjustment.LowerTierAdversary]: 1,
  [DhBattleAdjustment.NoHeavyHitters]: 1,
  [DhBattleAdjustment.HarderOrLonger]: 2,
};

/** The adjustments, in `daggerheart.md` §5's order, as checkbox options. */
export const dhBattleAdjustments: SelectOption<DhBattleAdjustment>[] =
  Object.values(DhBattleAdjustment).map((adjustment) => ({
    value: adjustment,
    labelKey: `daggerheart.battleAdjustments.${adjustment}`,
  }));
