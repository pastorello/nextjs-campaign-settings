/** The three denominations Daggerheart's gold is shown in, largest first. */
export const GOLD_UNITS = ["chests", "bags", "handfuls"] as const;
export type GoldUnit = (typeof GOLD_UNITS)[number];

/**
 * A whole number of handfuls split into chests, bags and handfuls
 * (`daggerheart.md` §7: 10 handfuls a bag, 10 bags a chest). SPEC-030 §9
 * decision 6 stores gold as handfuls, so this is display only.
 */
export function splitGold(handfuls: number): Record<GoldUnit, number> {
  const whole = Math.max(0, Math.trunc(handfuls));
  return {
    chests: Math.floor(whole / 100),
    bags: Math.floor(whole / 10) % 10,
    handfuls: whole % 10,
  };
}

/**
 * Gold as the table says it, e.g. "1 chest, 2 bags": only the denominations
 * present, and "0 handfuls" for none. A negative amount (a budget overspent)
 * keeps its sign. `label` names one denomination, so the caller supplies
 * the catalogue's plural rules.
 */
export function formatGold(
  handfuls: number,
  label: (unit: GoldUnit, count: number) => string
): string {
  const parts = splitGold(Math.abs(handfuls));
  const shown = GOLD_UNITS.filter((unit) => parts[unit] > 0).map((unit) =>
    label(unit, parts[unit])
  );
  const text = shown.length > 0 ? shown.join(", ") : label("handfuls", 0);
  return handfuls < 0 ? `−${text}` : text;
}
