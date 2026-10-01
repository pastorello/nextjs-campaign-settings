/**
 * The world tree as SPEC-022's visibility reads it: every zone with its parent,
 * every landmark with its zone, and each one's reveals. Small enough to hold
 * whole (hundreds of rows), so inheritance is walked here in memory rather
 * than in a recursive query per read path (SPEC-022 §9).
 */
export interface PlaceTree {
  zones: Map<
    number,
    { parentId: number | null; title: string; revealedTo: Set<number> }
  >;
  pois: Map<
    number,
    { zoneId: number | null; title: string; revealedTo: Set<number> }
  >;
}

export type PlaceKind = "zone" | "poi";

/**
 * The places a campaign's players may see (SPEC-022 §5, inheritance): a zone
 * only if it and every ancestor are revealed to the campaign, and a landmark
 * only if it is revealed and its zone is visible. Inheritance only hides:
 * revealing a region reveals nothing inside it.
 */
export function computeVisiblePlaces(
  tree: PlaceTree,
  campaignId: number
): { zones: Set<number>; pois: Set<number> } {
  const memo = new Map<number, boolean>();
  const zoneVisible = (id: number, seen = new Set<number>()): boolean => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    const zone = tree.zones.get(id);
    // A missing zone or a cycle hides, never reveals.
    if (!zone || seen.has(id)) return false;
    seen.add(id);
    const visible =
      zone.revealedTo.has(campaignId) &&
      (zone.parentId === null || zoneVisible(zone.parentId, seen));
    memo.set(id, visible);
    return visible;
  };

  const zones = new Set<number>();
  for (const id of tree.zones.keys()) if (zoneVisible(id)) zones.add(id);

  const pois = new Set<number>();
  for (const [id, poi] of tree.pois) {
    if (
      poi.revealedTo.has(campaignId) &&
      poi.zoneId !== null &&
      zones.has(poi.zoneId)
    ) {
      pois.add(id);
    }
  }
  return { zones, pois };
}

/**
 * The nearest ancestor of a place that is not revealed to the campaign, and
 * so hides it whatever its own reveal says, or null when none does. It is
 * what the reveal dialog names, so the DM knows what to reveal next.
 */
export function hidingAncestor(
  tree: PlaceTree,
  kind: PlaceKind,
  id: number,
  campaignId: number
): string | null {
  let parentId =
    kind === "zone"
      ? (tree.zones.get(id)?.parentId ?? null)
      : (tree.pois.get(id)?.zoneId ?? null);
  const seen = new Set<number>();
  while (parentId !== null && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = tree.zones.get(parentId);
    if (!parent) return null;
    if (!parent.revealedTo.has(campaignId)) return parent.title;
    parentId = parent.parentId;
  }
  return null;
}
