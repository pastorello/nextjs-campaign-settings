import type GameSystem from "@/app/lib/definitions/GameSystem";

/** The dashboard's root, before the system segment. */
export const DASHBOARD_ROOT = "/dashboard";

/**
 * Builds every dashboard path (ADR-0013 rule 5): `dashboardPath("dnd5e",
 * "/spells")` is `/dashboard/dnd5e/spells`. The locale is not added here —
 * hand the result to next-intl's `Link`, `redirect` or `useRouter` from
 * `./navigation`, which do that.
 *
 * Nothing else in the source may spell out a dashboard path: a link that
 * drops the system does not break, it silently lands on the default system
 * through `proxy.ts`'s redirect. `dashboardPaths.test.ts` enforces that.
 *
 * `path` is empty for the overview, or starts with `/`.
 */
export function dashboardPath(
  system: GameSystem,
  path: "" | `/${string}` = ""
) {
  return `${DASHBOARD_ROOT}/${system}${path}`;
}
