import { DASHBOARD_ROOT, dashboardPath } from "@/i18n/dashboardPath";

type DashboardSubpath = Parameters<typeof dashboardPath>[1];

/**
 * The dashboard pages a player may open (SPEC-022 T7, T8), as paths inside
 * the system segment. A page joins this list only once every read path it
 * reaches filters by the viewer's campaign: until then the proxy rewrites a
 * player to the 403 page, and the side navigation does not offer it.
 */
export const PLAYER_PAGES: readonly DashboardSubpath[] = ["/geography"];

/**
 * Whether the proxy lets a player through to a dashboard path
 * (`/dashboard/<system>/...`, locale already stripped). The overview is
 * let through too: until T8 opens it, it sends a player on to their
 * campaign's map before reading anything.
 */
export function isPlayerPath(path: string): boolean {
  const afterRoot = path.slice(DASHBOARD_ROOT.length + 1);
  const slash = afterRoot.indexOf("/");
  const subpath = slash === -1 ? "" : afterRoot.slice(slash);
  if (subpath === "" || subpath === "/") return true;
  return PLAYER_PAGES.some(
    (page) => subpath === page || subpath.startsWith(`${page}/`)
  );
}
