import { dashboardPath } from "@/i18n/dashboardPath";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";

/**
 * Each searchable domain's list page, relative to the dashboard root —
 * `null` for places, which have no list page (SPEC-011 §5.4).
 */
export const RECORD_LIST_PATH: Record<RecordLinkDomain, `/${string}` | null> = {
  spells: "/spells",
  magicItems: "/magicitems",
  npc: "/npc",
  deities: "/deities",
  factions: "/factions",
  places: null,
};

/**
 * Where a record opens (SPEC-011 §5.5), shared by the search results and
 * formatted-text record links (SPEC-019): a catalogue record opens its list
 * page filtered to its name — the convention SPEC-006 set in the absence of
 * per-record routes — and a place opens its map. The path is locale-free;
 * hand it to next-intl's `Link` (ADR-0013 rule 5).
 */
export default function recordHref(
  system: GameSystem,
  domain: RecordLinkDomain,
  record: { id: number; name: string }
): string {
  const listPath = RECORD_LIST_PATH[domain];
  if (listPath === null) {
    return dashboardPath(system, `/geography?place=${record.id}`);
  }
  return dashboardPath(
    system,
    `${listPath}?query=${encodeURIComponent(record.name)}`
  );
}
