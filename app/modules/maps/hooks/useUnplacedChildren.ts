"use client";

import { useEffect, useState } from "react";

import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import { isPlaceKind } from "@/app/modules/maps/constants/place-kinds";
import type { PlaceKind } from "@/app/modules/maps/types/poi";

export interface UnplacedChild {
  id: number;
  title: string;
  kind: PlaceKind;
}

/**
 * The current place's children that have no position yet — either `lat` or
 * `lng` is still `null` (SPEC-004's seeded tree leaves both `null` by
 * design: "assigned a parent, not yet placed"). Data only, no Leaflet — an
 * unplaced child has nothing to render on the map, which is exactly why a
 * list is the only way to reach it (SPEC-005 §5.A, TD-71).
 *
 * Same `refetchToken` convention as `useNavigableChildren`/
 * `useLinkedEntityMarkers`: bump it after a successful positioning so this
 * list drops the child that just gained coordinates.
 */
export function useUnplacedChildren(
  parentId: number,
  refetchToken: number = 0
): UnplacedChild[] {
  const [children, setChildren] = useState<UnplacedChild[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchPlaceChildren(parentId);
        const unplaced = rows.filter(
          (row): row is typeof row & { kind: PlaceKind } => {
            if (row.lat !== null && row.lng !== null) return false;
            if (!isPlaceKind(row.kind)) {
              console.warn("Discarding place with an unknown kind:", row.id);
              return false;
            }
            return true;
          }
        );
        if (cancelled) return;
        setChildren(
          unplaced.map((row) => ({
            id: row.id,
            title: row.title,
            kind: row.kind,
          }))
        );
      } catch (error) {
        console.error("Failed to load unplaced places:", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [parentId, refetchToken]);

  return children;
}
