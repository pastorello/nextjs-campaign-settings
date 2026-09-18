import { mod } from "./mod";
import { MOON_PHASES } from "./MoonPhase";
import type MoonPhase from "./MoonPhase";

/** The moon's cycle, exactly (SPEC-014 §5.3; `docs/domain/calendar.md`). */
export const LUNAR_CYCLE_DAYS = 28;

/**
 * The moon phase on a universal day, given the DM's reference new moon.
 *
 * The cycle is 28 days split into eight phases of 3½ days, measured from the
 * start of the reference day; a day takes the phase in force when it begins.
 * So the new moon, the quarters and the full moon each cover four days and
 * the four phases between them three: day 0 of the cycle is `new`, day 14 is
 * `full`. Days before the reference work the same way, counting backwards.
 *
 * Returns `null` while no reference is set — no phase is shown anywhere
 * until the DM sets one.
 */
export function moonPhaseOf(
  universalDay: number,
  referenceNewMoonDay: number | null
): MoonPhase | null {
  if (referenceNewMoonDay === null) return null;
  const dayOfCycle = mod(universalDay - referenceNewMoonDay, LUNAR_CYCLE_DAYS);
  // 3½ days per phase: floor(dayOfCycle / 3.5), kept in integers. The index
  // is always 0–7 because dayOfCycle is 0–27; `?? null` only satisfies
  // noUncheckedIndexedAccess.
  return MOON_PHASES[Math.floor((dayOfCycle * 2) / 7)] ?? null;
}
