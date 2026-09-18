import type GameSystem from "@/app/lib/definitions/GameSystem";
import pagesConfig from "@/app/lib/config/pagesConfig";
import PageType from "@/app/lib/definitions/types/PageType";

import { DASHBOARD_ROOT, dashboardPath } from "./dashboardPath";

const pageTypes = new Set<string>(Object.values(PageType));

/** The system a page belongs to, or `undefined` when it is shared. */
function pageSystem(segment: string | undefined) {
  if (segment === undefined || !pageTypes.has(segment)) return undefined;
  return pagesConfig[segment as PageType].system;
}

/**
 * Where the system switch goes (ADR-0013 rule 6). A shared page keeps its
 * path and query under the target system: `/dashboard/dnd5e/geography?place=12`
 * becomes `/dashboard/daggerheart/geography?place=12`. A catalogue page
 * (`/spells`, `/admin/spells/new`, `/spells/12/edit`) belongs to one system,
 * so under another it would be a 404: it goes to the target's overview.
 *
 * `pathname` is locale-free, as next-intl's `usePathname` returns it; the
 * caller's router adds the locale back. `search` has no leading `?`.
 */
export function switchSystemPath(
  pathname: string,
  search: string,
  target: GameSystem
): string {
  const prefix = `${DASHBOARD_ROOT}/`;
  if (!pathname.startsWith(prefix)) return dashboardPath(target);

  // Drop the current system segment; keep everything after it.
  const rest = pathname
    .slice(prefix.length)
    .split("/")
    .slice(1)
    .filter(Boolean);
  const page = rest[0] === "admin" ? rest[1] : rest[0];
  const owner = pageSystem(page);
  if (owner !== undefined && owner !== target) return dashboardPath(target);

  const path =
    rest.length > 0
      ? dashboardPath(target, `/${rest.join("/")}`)
      : dashboardPath(target);
  return search ? `${path}?${search}` : path;
}
