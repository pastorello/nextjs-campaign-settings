"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { POI } from "@/app/modules/maps/types/poi";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import unplacePlace from "@/app/lib/data/maps/unplacePlace";
import type { PopoverTarget } from "@/app/ui/geography/PlacePopover";

/**
 * The place popover's state and its zone-side actions (SPEC-016 T2/T5/T6)
 * — extracted from `WorldMap` (TD-127).
 *
 * The landmark-side actions (edit, un-place, delete) stay in `WorldMap`:
 * they need `usePOIManager`'s functions, and `usePOIManager` needs this
 * hook's `handlePOIClick` first. They close the popover through `close`.
 */
export function usePlacePopover({
  parentId,
  isMeasuring,
  onDescend,
  onPlacesChanged,
}: {
  parentId: number;
  isMeasuring: boolean;
  onDescend: (child: NavigableChild) => void;
  onPlacesChanged: () => void;
}): {
  target: PopoverTarget | null;
  close: () => void;
  handlePOIClick: (poi: POI, serverId: number) => void;
  handlePlaceClick: (child: NavigableChild) => void;
  handleOpenMap: (child: NavigableChild) => void;
  handleUnplace: (child: NavigableChild) => Promise<void>;
  handlePlaceDeleted: () => void;
} {
  const t = useTranslations("geography.errors");

  // The place popover (SPEC-016 T2, widened to landmarks in T7) — one at a
  // time by construction, a single state slot rather than a set. Clicking a
  // marker/rectangle (`useNavigableChildren`) or a landmark marker
  // (`usePOIManager`) used to descend/open a native Leaflet popup
  // respectively; now both open this instead, and "Apri mappa" inside the
  // popover is what actually descends (zone only — a landmark has none).
  const [target, setTarget] = useState<PopoverTarget | null>(null);

  // The popover refers to a place on the map being left (SPEC-016 T2) —
  // `WorldMap` isn't remounted on `parentId` change, so without this it
  // would survive the navigation open, anchored to nothing on the new map.
  // The "adjusting state during render" pattern, for the reason `WorldMap`'s
  // own reset block gives.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    setTarget(null);
  }

  // A landmark marker click opens the popover (SPEC-016 T7), the same
  // `isMeasuring` guard `handlePlaceClick` uses below for the identical
  // reason (§5's edge-case table: map clicks belong to the measure tool
  // while it's active). `WorldMap` passes it to `usePOIManager` as that
  // hook's own `onPOIClick` argument — the same ordering constraint
  // `handleEditMode`/`createMarker` already impose inside that hook.
  const handlePOIClick = useCallback(
    // `serverId` comes from the hook, which owns the client-id -> row-id
    // mapping (TD-108). The popover needs the row's id and cannot get it
    // from `poi.id`, which is a client key on a landmark created in this
    // session.
    (poi: POI, serverId: number) => {
      if (isMeasuring) return;
      setTarget({ kind: "poi", poi, poiId: serverId });
    },
    [isMeasuring]
  );

  // A marker/rectangle click opens the popover instead of descending
  // directly (SPEC-016 T2) — suppressed while measuring, since map clicks
  // belong to the measure tool then (§5's edge-case table). Other crosshair
  // modes (positioning, drawing an area) don't need a guard here: a Leaflet
  // marker/rectangle click never reaches the map's own click handler those
  // modes listen on.
  const handlePlaceClick = useCallback(
    (child: NavigableChild) => {
      if (isMeasuring) return;
      setTarget({ kind: "zone", place: child });
    },
    [isMeasuring]
  );

  // "Apri mappa" (SPEC-016 T2) — the popover's own descend action, now the
  // only path into `onDescend`.
  const handleOpenMap = useCallback(
    (child: NavigableChild) => {
      onDescend(child);
      setTarget(null);
    },
    [onDescend]
  );

  const close = useCallback(() => {
    setTarget(null);
  }, []);

  // "Sposta nei luoghi non posizionati" (SPEC-016 T5) — no confirmation
  // (§9's open question, agreed 2026-08-21). Clears the place's position
  // (and, for an area, its footprint — `unplacePlace` handles both) and
  // sends it back to the unpositioned pool. Success bumps
  // `placesRefetchToken` (`onPlacesChanged`), the same convention
  // `usePlacePositioning` uses in the other direction, so the unplaced pool
  // picks up the child and `navigableChildren` drops its marker; the popover
  // closes since there is nothing left at this position to show.
  // `unpositionedCount` itself gets no equivalent bump here, because a
  // client-side "bonus" on top of whatever the server already did
  // double-counted — that much was observed, and it is the reason this code
  // looks the way it does.
  //
  // What the server did is re-render this page: `unplacePlace` calls
  // `revalidateDashboard("geography")`, and any `revalidatePath` call it
  // makes — whatever path it names — flags the action as revalidated, which
  // is what makes Next send a fresh render with the action's response. That
  // flag, not a cache match, is why pointing the call at a nonsense path
  // once left `map-unplace.spec` passing; removing the call would not. The
  // helper now passes the route's real file location,
  // `/[locale]/dashboard/[system]/geography`, which costs nothing and is
  // what makes the call correct if a cache ever does apply here — see
  // TD-105 and ADR-0014.
  const handleUnplace = useCallback(
    async (child: NavigableChild) => {
      try {
        const result = await unplacePlace({ id: child.id });
        if (result.ok) {
          onPlacesChanged();
          setTarget(null);
        } else {
          toast.error(t("placeUnplaceFailed", { title: child.title }));
        }
      } catch (error) {
        console.error("Failed to un-place the place:", error);
        toast.error(t("placeUnplaceFailed", { title: child.title }));
      }
    },
    [onPlacesChanged, t]
  );

  // "Elimina definitivamente" (SPEC-016 T6) — `PlacePopover` embeds
  // `DeletePlaceButton` itself (the confirmation dialog and the SPEC-010
  // mutation are entirely its own); this only runs once it reports success.
  // Same bookkeeping `handleUnplace` does, for the same reason: the deleted
  // place is a child of the one currently being viewed, not the one
  // currently being viewed itself, so there is no navigation stack to pop —
  // just a marker to drop and a popover with nothing left to show.
  const handlePlaceDeleted = useCallback(() => {
    onPlacesChanged();
    setTarget(null);
  }, [onPlacesChanged]);

  return {
    target,
    close,
    handlePOIClick,
    handlePlaceClick,
    handleOpenMap,
    handleUnplace,
    handlePlaceDeleted,
  };
}
