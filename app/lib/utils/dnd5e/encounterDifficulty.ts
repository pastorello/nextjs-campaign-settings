import {
  BUDGET_LEVEL_MAX,
  BUDGET_LEVEL_MIN,
  XP_BUDGET_PER_CHARACTER,
  type XpBudget,
} from "@/app/lib/config/dnd5e/encounterBudget";

/**
 * Where a fight's XP falls (SPEC-031 §5.B; the DM's answer of 2026-10-02):
 * the SRD 5.2.1's three grades, each the budget the fight stays within,
 * and a fourth for a fight over the high budget.
 */
export type EncounterBand = "low" | "moderate" | "high" | "aboveHigh";

/** What a fight's XP is read from: each row's XP, and how many count. */
export interface XpRow {
  xpEach: number | null;
  quantity: number;
}

export interface EncounterDifficulty {
  /** The counted rows' XP: XP each × quantity, summed. */
  xp: number;
  /** Rows with no XP, counted apart rather than as zero. */
  unpriced: number;
  /** The party's budget for each grade. */
  budgets: XpBudget;
  /** `null` when nothing is priced: no rows, all excluded, or none with XP. */
  band: EncounterBand | null;
}

/** The party level the budget is read at: whole, and within 1–20. */
function budgetLevel(targetLevel: number): number {
  const level = Math.trunc(targetLevel);
  if (!Number.isFinite(level)) return BUDGET_LEVEL_MIN;
  return Math.min(BUDGET_LEVEL_MAX, Math.max(BUDGET_LEVEL_MIN, level));
}

/**
 * A 5e fight's difficulty for the party (`5e-encounters.md` §2): the
 * per-character budget at the target level times the party size, and the
 * smallest grade whose budget the fight's XP stays within — the SRD's own
 * rule read backwards. There is no multiplier for the number of creatures.
 * The rows are the counted ones (SPEC-031 §5.C): excluded rows removed and
 * each quantity the counted one.
 */
export default function encounterDifficulty(
  rows: readonly XpRow[],
  partySize: number,
  targetLevel: number
): EncounterDifficulty {
  let xp = 0;
  let unpriced = 0;
  for (const row of rows) {
    if (row.xpEach === null) unpriced += 1;
    else xp += row.xpEach * row.quantity;
  }

  const characters = Math.max(1, Math.trunc(partySize) || 1);
  const perCharacter = XP_BUDGET_PER_CHARACTER[
    budgetLevel(targetLevel) - BUDGET_LEVEL_MIN
  ] as XpBudget;
  const budgets: XpBudget = {
    low: perCharacter.low * characters,
    moderate: perCharacter.moderate * characters,
    high: perCharacter.high * characters,
  };

  let band: EncounterBand | null = null;
  if (xp > 0) {
    if (xp <= budgets.low) band = "low";
    else if (xp <= budgets.moderate) band = "moderate";
    else if (xp <= budgets.high) band = "high";
    else band = "aboveHigh";
  }

  return { xp, unpriced, budgets, band };
}
