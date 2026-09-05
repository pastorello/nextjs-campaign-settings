import fetchZoneDescendantIds from "./fetchZoneDescendantIds";
import type { PlacementErrors } from "./checkPlacement";

/**
 * Refuses a placement that would break the tree (SPEC-017 T5, ADR-0012): a
 * place may not be placed on its own map, nor on the map of anything it
 * contains. "Terra" dropped inside "Regno di Kang", which is under Terra,
 * cuts that whole subtree off the root — and Postgres will accept it
 * happily, because `zone.parentId` is an ordinary self-referencing foreign
 * key with nothing to say about cycles. That is the same reason
 * `fetchZoneDescendantIds` walks with a `seen` guard rather than trusting
 * the data it reads.
 *
 * **Deliberately not in `checkPlacement.ts`.** Those two are SPEC-009 §7's
 * *spatial* rules — where a pin may sit among its siblings, whether an area
 * overlaps another. This one is structural: it would have been true before
 * places had coordinates at all, and it is the only check here that can
 * refuse a placement the map itself renders as perfectly reasonable.
 *
 * **Shared rather than inlined** into `placeZone`, because placement is not
 * guaranteed to stay the only writer of the tree edge — ADR-0012's *Revisit
 * when* names a second writer as the moment to look again, and a second
 * writer needs to be able to find this rule rather than reinvent it (TD-77
 * is what reinventing it looks like).
 */
export default async function checkTreePlacement({
  zoneId,
  targetParentId,
}: {
  zoneId: number;
  targetParentId: number;
}): Promise<PlacementErrors | null> {
  // Includes `zoneId` itself — which is exactly the "placed on its own map"
  // case, reachable because an unplaced zone keeps its map and can still be
  // opened from a search result (SPEC-011 T4).
  const subtree = await fetchZoneDescendantIds(zoneId);
  if (!subtree.includes(targetParentId)) return null;

  return {
    parentId: [
      targetParentId === zoneId
        ? "A place cannot be placed on its own map."
        : "A place cannot be placed inside a place that it contains.",
    ],
  };
}
