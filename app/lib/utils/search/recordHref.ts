import { dashboardPath } from "@/i18n/dashboardPath";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";

/**
 * Each searchable domain's list page, relative to the dashboard root — the
 * search page's "see all" link filters it by the term. `null` for places,
 * which have no list page (SPEC-011 §5.4). Subclasses have no public list
 * (a subclass is shown on its class's page, SPEC-021 T6), so theirs is the
 * admin one.
 */
export const RECORD_LIST_PATH: Record<RecordLinkDomain, `/${string}` | null> = {
  spells: "/spells",
  magicItems: "/magicitems",
  npc: "/npc",
  deities: "/deities",
  factions: "/factions",
  places: null,
  dhDomains: "/domains",
  dhDomainCards: "/domain-cards",
  dhClasses: "/classes",
  dhSubclasses: "/admin/subclasses",
};

/**
 * The domains whose records have a page of their own, at `<path>/<id>`
 * (SPEC-021): a domain's page, a class's page, and a subclass's route, which
 * redirects to its place on its class's page. The others open their list
 * filtered to the record's name.
 */
const RECORD_PAGE_PATH: Partial<Record<RecordLinkDomain, `/${string}`>> = {
  dhDomains: "/domains",
  dhClasses: "/classes",
  dhSubclasses: "/subclasses",
};

/**
 * Where a record opens (SPEC-011 §5.5), shared by the search results and
 * formatted-text record links (SPEC-019): a record with a page of its own
 * opens it; any other catalogue record opens its list page filtered to its
 * name — the convention SPEC-006 set in the absence of per-record routes —
 * and a place opens its map. Only the id and name are needed, since a stored
 * record link carries no more. The path is locale-free; hand it to
 * next-intl's `Link` (ADR-0013 rule 5).
 */
export default function recordHref(
  system: GameSystem,
  domain: RecordLinkDomain,
  record: { id: number; name: string }
): string {
  const pagePath = RECORD_PAGE_PATH[domain];
  if (pagePath !== undefined) {
    return dashboardPath(system, `${pagePath}/${record.id}`);
  }
  const listPath = RECORD_LIST_PATH[domain];
  if (listPath === null) {
    return dashboardPath(system, `/geography?place=${record.id}`);
  }
  return dashboardPath(
    system,
    `${listPath}?query=${encodeURIComponent(record.name)}`
  );
}
