import { DASHBOARD_ROOT, dashboardPath } from "@/i18n/dashboardPath";

type DashboardSubpath = Parameters<typeof dashboardPath>[1];

/**
 * The dashboard pages a player may open (SPEC-022 T7, T8), as paths inside
 * the system segment. A page joins this list only once every read path it
 * reaches filters by the viewer's campaign: until then the proxy rewrites a
 * player to the 403 page, and the side navigation does not offer it.
 */
export const PLAYER_PAGES: readonly DashboardSubpath[] = [
  // The overview and the search (R1, R10, T8c): counts and hits of what
  // the campaign has been shown.
  "",
  "/search",
  "/geography",
  // The shared world's records (R2–R6, T8b), each filtered to what the
  // campaign has been shown.
  "/deities",
  "/magicitems",
  "/npc",
  "/factions",
  // The rules catalogues (R14, T8): the rules the table plays by, the same
  // for every player, so no filter. Each is a 404 under the other system.
  "/spells",
  "/classes",
  "/subclasses",
  "/domains",
  "/domain-cards",
  "/ancestries",
  // SPEC-029 §9 decision 1: the equipment the players choose from. Loot is
  // handed out, so it stays the DM's.
  "/weapons",
  // A catalogue too, but linked into the world: its places and factions are
  // filtered to the campaign's (SPEC-027 T3).
  "/communities",
];

/**
 * Whether the proxy lets a player through to a dashboard path
 * (`/dashboard/<system>/...`, locale already stripped).
 */
export function isPlayerPath(path: string): boolean {
  const afterRoot = path.slice(DASHBOARD_ROOT.length + 1);
  const slash = afterRoot.indexOf("/");
  const subpath =
    slash === -1 || slash === afterRoot.length - 1
      ? ""
      : afterRoot.slice(slash);
  return PLAYER_PAGES.some((page) =>
    page === ""
      ? subpath === ""
      : subpath === page || subpath.startsWith(`${page}/`)
  );
}
