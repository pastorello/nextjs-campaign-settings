/**
 * The moon's eight phases, in cycle order from the new moon (SPEC-014 §5.3).
 * Identifiers, not display strings: names are UI copy and come from the
 * message catalogues.
 */
export const MOON_PHASES = [
  "new",
  "waxingCrescent",
  "firstQuarter",
  "waxingGibbous",
  "full",
  "waningGibbous",
  "lastQuarter",
  "waningCrescent",
] as const;

type MoonPhase = (typeof MOON_PHASES)[number];

export default MoonPhase;
