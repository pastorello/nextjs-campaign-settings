import { isSearchDomainInSystem } from "@/app/lib/data/search/searchAllDomains";
import type RecordLinkResolution from "@/app/lib/definitions/types/RecordLinkResolution";
import collectRecordLinks from "@/app/lib/utils/richText/collectRecordLinks";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";

import fetchRecordLinkTargets from "./fetchRecordLinkTargets";

/**
 * `fetchRecordLinkTargets` plus the links it could not resolve **within** the
 * route's system (SPEC-019 T5) — deleted records, which the editor opens
 * unlinked. Same cost: one query per linked domain, none when nothing links.
 */
export default async function fetchRecordLinkResolution(
  values: readonly (string | null | undefined)[],
  system: string
): Promise<RecordLinkResolution> {
  const targets = await fetchRecordLinkTargets(values, system);
  const deleted = collectRecordLinks(values)
    .filter(({ domain }) => isSearchDomainInSystem(domain, system))
    .map(({ domain, id }) => recordLinkKey(domain, id))
    .filter((key) => targets[key] === undefined);
  return { targets, deleted };
}
