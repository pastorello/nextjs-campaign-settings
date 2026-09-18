import { revalidatePath } from "next/cache";

/**
 * Domain segments that exist under `app/[locale]/dashboard/[system]/` —
 * nested ones (`world/calendar`) spelled as their path below it.
 * Keep this in sync with that directory listing — a domain missing here is
 * a compile error at the call site, not a silently-ignored typo (TD-105
 * found 19 of the original 48 calls naming a path that matched nothing).
 */
export type DashboardDomain =
  | "campaign"
  | "deities"
  | "factions"
  | "geography"
  | "magicitems"
  | "npc"
  | "spells"
  | "treasures"
  | "world"
  | "world/calendar";

/**
 * Revalidates the dashboard page for `domain` after a mutating Server
 * Action, so the reader sees the action's effect without a full reload.
 *
 * **What this call actually does today (ADR-0014, TD-105's 2026-09-11
 * correction).** No dashboard page is ever cached — every one reaches
 * `requireSession()`, which forces dynamic rendering — so there is no cache
 * entry here to invalidate. What `revalidatePath` does regardless of the
 * path it is given is set `workStore.pathWasRevalidated`, and it is that
 * flag, not a cache match, that makes Next render the page again and send
 * the fresh HTML back with the action's response. Deleting the call would
 * stop that in-place refresh; see the ADR for how this was verified.
 *
 * **Why the path is still correct, not `/dashboard/<domain>` or a
 * game-system-specific string.** `revalidatePath` operates on the route
 * *file* structure, not a URL: a dynamic segment is spelled with its
 * bracket name (`[locale]`, `[system]`), and `type: "page"` is required
 * whenever the path contains one. Getting this right costs nothing today
 * and is what makes the call correct if a cache ever does start applying
 * here (PPR, `use cache`, a static shell).
 *
 * **Why a helper.** Every dashboard mutation used to call `revalidatePath`
 * directly, with the path spelled out by hand — 48 call sites, most of
 * them wrong in one of two ways (TD-105). Routing every call through here
 * makes a typo in the domain a type error instead of a filter that quietly
 * stops refreshing, and makes a future switch to `next/cache`'s `refresh()`
 * (ADR-0014's deferred alternative) a one-file change.
 */
export function revalidateDashboard(domain: DashboardDomain): void {
  revalidatePath(`/[locale]/dashboard/[system]/${domain}`, "page");
}
