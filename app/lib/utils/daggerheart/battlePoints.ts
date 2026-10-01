import {
  DH_ADVERSARY_TYPE_COST,
  DH_BATTLE_ADJUSTMENT_POINTS,
} from "@/app/lib/config/daggerheart/dhBattlePoints";
import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import DhBattleAdjustment from "@/app/lib/definitions/enums/daggerheart/DhBattleAdjustment";

/** What a creature row's Battle Points are read from (SPEC-030 T3). */
export interface PricedAdversary {
  /** `dhAdversary.adversaryType`, a raw `String` column. */
  adversaryType: string;
  tier: number;
}

export interface BattlePointRow {
  quantity: number;
  /** `null` once the adversary is deleted (`SetNull`), or never linked. */
  dhAdversary?: PricedAdversary | null;
}

function isAdversaryType(value: string): value is DhAdversaryType {
  return (Object.values(DhAdversaryType) as string[]).includes(value);
}

/**
 * The ticked adjustments a scene stores (`scene.battleAdjustments`, a raw
 * `String[]`), each once and in `daggerheart.md` §5's order; a key outside
 * the list is dropped rather than counted as zero.
 */
export function knownAdjustments(
  adjustments: readonly string[]
): DhBattleAdjustment[] {
  return Object.values(DhBattleAdjustment).filter((adjustment) =>
    adjustments.includes(adjustment)
  );
}

/**
 * A row's Battle Points (SPEC-030 §9 decision 4): its type's cost times its
 * quantity, except a Minion row, which pays once per group as large as the
 * party, rounded up. `null` is unpriced: no adversary, or a type outside the
 * vocabulary — a cost of 0 would read as a free creature.
 */
export function rowBattlePoints(
  row: BattlePointRow,
  partySize: number
): number | null {
  const type = row.dhAdversary?.adversaryType;
  if (type === undefined || !isAdversaryType(type)) return null;
  const cost = DH_ADVERSARY_TYPE_COST[type];
  if (type === DhAdversaryType.Minion) {
    return cost * Math.ceil(row.quantity / Math.max(1, partySize));
  }
  return cost * row.quantity;
}

/**
 * A fight's budget (`daggerheart.md` §5): 3 × the party size + 2, plus the
 * adjustments the DM ticked, each counted once.
 */
export function battlePointBudget(
  partySize: number,
  adjustments: readonly string[]
): number {
  let budget = 3 * partySize + 2;
  for (const adjustment of knownAdjustments(adjustments)) {
    budget += DH_BATTLE_ADJUSTMENT_POINTS[adjustment];
  }
  return budget;
}

/** What a fight's rows cost in all, and how many of them are unpriced. */
export function sceneBattlePoints(
  rows: readonly BattlePointRow[],
  partySize: number
): { spent: number; unpriced: number } {
  let spent = 0;
  let unpriced = 0;
  for (const row of rows) {
    const points = rowBattlePoints(row, partySize);
    if (points === null) unpriced += 1;
    else spent += points;
  }
  return { spent, unpriced };
}

/**
 * Whether the lower-tier adjustment is worth suggesting (SPEC-030 §9
 * decision 5): a row's adversary sits below the adventure's tier and the DM
 * has not ticked it. Only suggested, never ticked for the DM.
 */
export function suggestsLowerTier(
  rows: readonly BattlePointRow[],
  adventureTier: number,
  adjustments: readonly string[]
): boolean {
  if (adjustments.includes(DhBattleAdjustment.LowerTierAdversary)) {
    return false;
  }
  return rows.some(
    (row) => row.dhAdversary != null && row.dhAdversary.tier < adventureTier
  );
}
