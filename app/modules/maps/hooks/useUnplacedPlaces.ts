"use client";

import { useEffect, useState } from "react";

import fetchUnplacedPlaces from "@/app/lib/data/maps/fetchUnplacedPlaces";
import type UnplacedPlace from "@/app/lib/definitions/interfaces/maps/UnplacedPlace";

export type { UnplacedPlace };

/**
 * The campaign's unplaced places — **one pool, shared by every map**
 * (SPEC-017 T8), replacing `useUnplacedChildren`'s per-parent list.
 *
 * That list was derived from `fetchPlaceChildren(parentId)`, so it could
 * only ever offer the children of the map in view: a place parked under the
 * wrong parent was unreachable from everywhere else, because the list came
 * from the very tree edge the DM was trying to change (ADR-0012's context).
 * The pool is now campaign-wide and a placement writes that edge.
 *
 * Thinner than the hook it replaces because the work moved down rather than
 * away: `fetchUnplacedPlaces` merges the two tables, narrows `kind`,
 * discards what it cannot route, and sorts — all at the boundary where the
 * raw rows arrive (T2). What is left here is the fetch and its state.
 *
 * Same `refetchToken` convention as `useNavigableChildren` /
 * `useLinkedEntityMarkers`: bump it after a successful placement so the
 * pool drops the row that just gained coordinates.
 *
 * **`mapInView` is a refresh trigger, not a scope.** The pool is
 * campaign-wide and this argument never filters it — it re-reads when the
 * DM moves to another map, because the tree can change while they are
 * somewhere else and this is the only signal `WorldMap` gets that anything
 * happened. Deleting a place is the case that matters: SPEC-010 rule 2
 * sends its landmarks up to the grandparent without coordinates, so the
 * pool gains rows on a map the DM is about to be returned to. The hook this
 * replaced got the same refresh for free, by taking the parent id it
 * scoped on; losing it silently is a staleness bug an e2e caught rather
 * than a unit test, since a mocked hook has no data to go stale.
 *
 * **Not filtered for this map.** Which of these places may be placed *here*
 * is the caller's question — `WorldMap` leaves out the map's own ancestors,
 * which T5 would refuse anyway — and keeping that out of the hook is what
 * lets one fetch serve every map in the stack.
 */
export function useUnplacedPlaces(
  refetchToken: number = 0,
  mapInView: number = 0
): UnplacedPlace[] {
  const [places, setPlaces] = useState<UnplacedPlace[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchUnplacedPlaces();
        if (cancelled) return;
        setPlaces(rows);
      } catch (error) {
        console.error("Failed to load unplaced places:", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [refetchToken, mapInView]);

  return places;
}
