/**
 * Display-only choice for `adventure.currencyUnit` (SPEC-013 §6, "Currency:
 * one stored unit, two displayed") — not one of T3's three closed
 * vocabularies, so a plain string literal union rather than a dedicated enum
 * (see `Adventure.ts`'s own note on this). Every value is stored in silver;
 * this only selects how it renders.
 */
interface CurrencyUnitObject {
  value: "silver" | "gold";
  labelKey: string;
}

const currencyUnits: CurrencyUnitObject[] = [
  { value: "silver", labelKey: "adventure.currencyUnits.silver" },
  { value: "gold", labelKey: "adventure.currencyUnits.gold" },
];

export default currencyUnits;
