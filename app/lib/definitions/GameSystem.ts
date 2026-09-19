/**
 * The game systems the dashboard can be viewed through (ADR-0013 rule 1).
 *
 * The values are the URL slugs: `/dashboard/dnd5e/spells`. A system joins
 * this list with its first catalogue slice, never before, so the switch
 * never offers a system with nothing behind it. `daggerheart` joined with
 * SPEC-021 T1.
 */
export const GAME_SYSTEMS = ["dnd5e", "daggerheart"] as const;

type GameSystem = (typeof GAME_SYSTEMS)[number];

/** Where a URL without a system segment lands (ADR-0013 rule 3). */
export const DEFAULT_GAME_SYSTEM: GameSystem = "dnd5e";

export function isGameSystem(value: unknown): value is GameSystem {
  return (GAME_SYSTEMS as readonly unknown[]).includes(value);
}

export default GameSystem;
