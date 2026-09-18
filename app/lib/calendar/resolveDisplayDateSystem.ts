import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";

/**
 * The system a viewer's dates are shown in (SPEC-014 §5.2): the one their
 * toggle chose, if it still exists, else the world default, else the
 * universal count. A preference naming a deleted system silently falls back
 * rather than erroring — the cookie outlives the row. `undefined` only for
 * an empty list, which the migration's seeded universal count rules out.
 */
export function resolveDisplayDateSystem(
  systems: readonly DateSystem[],
  preferredId: number | null
): DateSystem | undefined {
  return (
    systems.find((system) => system.id === preferredId) ??
    systems.find((system) => system.isDefault) ??
    systems.find((system) => system.isUniversal) ??
    systems[0]
  );
}
