export type CurrencyUnit = "silver" | "gold";

const SILVER_PER_GOLD = 10;

/**
 * SPEC-013 §6, "Currency: one stored unit, two displayed" — every monetary
 * value in the campaign spec is stored as an integer number of silver;
 * `unit` only chooses how it renders. 1 gold = 10 silver, in both the system
 * this campaign came from and the one the app targets. Changing an
 * adventure's `currencyUnit` therefore rewrites nothing — it only changes
 * which of these two functions the render path calls.
 */
export function toDisplayAmount(silver: number, unit: CurrencyUnit): number {
  return unit === "gold" ? silver / SILVER_PER_GOLD : silver;
}

export function toStoredSilver(amount: number, unit: CurrencyUnit): number {
  return unit === "gold" ? amount * SILVER_PER_GOLD : amount;
}
