"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import PlaceEntityList, {
  type EntityListTarget,
} from "@/app/ui/geography/PlaceEntityList";
import AttachEntityButton from "@/app/ui/geography/AttachEntityButton";
import DeletePlaceButton from "@/app/ui/geography/DeletePlaceButton";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type { POI } from "@/app/modules/maps/types/poi";

/**
 * What the popover is anchored to (T7) — a navigable zone (marker or drawn
 * area, `useNavigableChildren`) or a landmark POI (`usePOIManager`). Each
 * carries its click source's own shape rather than a normalised common one:
 * the two overlap (id/title/description/lat/lng) but aren't identical — a
 * zone has a `mapImage` to open and a position to clear, a landmark has
 * neither (§5's landmark flow) — and forcing a shared shape would either
 * lose those fields or fake them.
 */
export type PopoverTarget =
  { kind: "zone"; place: NavigableChild } | { kind: "poi"; poi: POI };

interface PlacePopoverProps {
  target: PopoverTarget;
  /**
   * The place currently being viewed — this popover's target's own parent.
   * Named in the zone deletion dialog's reparent message (T6); pre-fills
   * the attach control's Zone step for a landmark (T7), whose own `POI`
   * shape carries no `zoneId` of its own (`usePOIManager` scopes POIs to
   * this id instead).
   */
  parentId: number;
  parentTitle: string;
  onClose: () => void;
  onOpenMap: (place: NavigableChild) => void;
  /**
   * "Sposta nei luoghi non posizionati" (T5) — no confirmation (§9's open
   * question, agreed 2026-08-21). The mutation and its refetch/count
   * bookkeeping are `WorldMap`'s, the same split as `onOpenMap`. Zone
   * only — §5's landmark flow has nothing equivalent.
   */
  onUnplace: (place: NavigableChild) => void;
  /**
   * "Rimuovi definitivamente" (T6) succeeded — `WorldMap` closes the
   * popover and drops its marker, the same bookkeeping `onUnplace` does,
   * since the place this popover is anchored to no longer exists. Zone
   * only — a landmark's own deletion is `onDeleteLandmark` below.
   */
  onDeleted: () => void;
  /**
   * "Modifica" (T7) — opens `MapPOIPanel`'s existing edit form for this
   * landmark, pre-filled (TD-85's remainder, finally reachable). The panel
   * is a single shared instance owned by `WorldMap`, not something this
   * popover can mount a second copy of the way T6 embeds `DeletePlaceButton`
   * — so unlike deletion, this delegates entirely rather than embedding
   * anything.
   */
  onEditLandmark: (poi: POI) => void;
  /**
   * "Elimina" (T7) — the existing, unconfirmed `usePOIManager.deletePOI`
   * (§5: "deleting and re-creating a landmark is cheap," why this popover
   * adds no confirmation of its own, unlike the zone's "Rimuovi
   * definitivamente"). `WorldMap` owns the hook, so this delegates too.
   */
  onDeleteLandmark: (poi: POI) => void;
}

/**
 * The place popover (SPEC-016) — anchored to the marker or rectangle the DM
 * clicked, replacing the old click-to-descend behaviour
 * (`useNavigableChildren`, T2). This shell carries the title, description
 * and "Apri mappa", plus the entities present at the place (T3), the attach
 * control (T4), un-placing (T5) and deletion (T6) for a zone; T7 adds the
 * landmark variant on top — same shell, `target.kind` swaps which action
 * buttons render and which discriminant `PlaceEntityList`/`AttachEntityButton`
 * are given.
 *
 * Tracks the map's own `move`/`zoom` events to stay anchored to the clicked
 * place's `lat`/`lng` while the DM pans, rather than closing on any map
 * movement the way `MapContextMenu` does — a popover the DM is reading is
 * worth keeping open through a small pan, unlike a menu whose position only
 * ever mattered for the single click that opened it.
 *
 * "Collega personaggio" (T4) reuses `AttachEntityButton` as-is, pre-filled
 * with the clicked zone rather than the map's own currently-viewed parent —
 * the same component the right-click menu still opens today (TD-96's
 * removal is T8). A successful attach bumps `refreshKey` rather than
 * threading the new entity through state: the list has just been told to
 * refetch, and `AssignLocationModal` already knows nothing about what it
 * assigned beyond an id. For a landmark (T7), the same control also pre-fills
 * `poiId` — `AttachEntityButton`'s own extension, not a second mechanism.
 *
 * "Sposta nei luoghi non posizionati" (T5) only calls `onUnplace` — the
 * mutation, the refetch that drops this place's own marker, and closing the
 * popover are all `WorldMap`'s, since un-placing removes the very place this
 * popover is anchored to.
 *
 * "Rimuovi definitivamente" (T6), by contrast, embeds `DeletePlaceButton`
 * directly — the same component `MapOptionsButton` already opens for the
 * place currently being viewed, unforked, retargeted at the clicked place.
 * Its confirmation dialog (impact counts, the SPEC-010 mutation itself) is
 * entirely its own; only the post-success bookkeeping — closing the popover,
 * dropping the marker — bubbles up through `onDeleted`, the same split T5
 * uses for `onUnplace`.
 *
 * "Modifica"/"Elimina" (T7) both delegate to `WorldMap` instead — the panel
 * they reach (`MapPOIPanel`) and the mutation they call (`usePOIManager`'s
 * `updatePOI`/`deletePOI`) are both singletons WorldMap already owns, so
 * there is nothing for this popover to embed, only a target to hand back.
 */
export default function PlacePopover({
  target,
  parentId,
  parentTitle,
  onClose,
  onOpenMap,
  onUnplace,
  onDeleted,
  onEditLandmark,
  onDeleteLandmark,
}: PlacePopoverProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.popover");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [entitiesRefreshKey, setEntitiesRefreshKey] = useState(0);
  const [screenPosition, setScreenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Narrowed once, reused by every kind-specific button block below —
  // `null` is the "not this kind" branch, so `place &&`/`poi &&` in JSX
  // reads the same way `hasMap`'s own guard always has.
  const place = target.kind === "zone" ? target.place : null;
  const poi = target.kind === "poi" ? target.poi : null;

  const title = target.kind === "zone" ? target.place.title : target.poi.title;
  const description =
    target.kind === "zone"
      ? target.place.description
      : (target.poi.description ?? null);
  const lat = target.kind === "zone" ? target.place.lat : target.poi.lat;
  const lng = target.kind === "zone" ? target.place.lng : target.poi.lng;

  useEffect(() => {
    if (!map) return;

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([lat, lng]);
      setScreenPosition({ x: point.x, y: point.y });
    };

    updatePosition();
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);
    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, lat, lng]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // `AttachEntityButton`'s modal (T4) is Headless UI, which portals its
      // content to a root at `document.body` — outside `popoverRef` in the
      // DOM regardless of where the component sits in the React tree — so
      // a click inside it would otherwise read as "outside" and close the
      // popover out from under the modal it just opened.
      const insidePortal =
        target instanceof Element &&
        target.closest("[data-headlessui-portal]") !== null;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !insidePortal
      ) {
        onClose();
      }
    };
    // Delayed the same way `MapContextMenu` delays its own listener — the
    // Leaflet marker/rectangle click that opened this popover would
    // otherwise bubble into this same handler and close it instantly.
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!screenPosition) return null;

  const hasMap = place !== null && place.mapImage !== null;

  const entityListTarget: EntityListTarget =
    target.kind === "zone"
      ? { zoneId: target.place.id }
      : { poiId: Number(target.poi.id) };

  // `usePOIManager`'s `POI.id` is a client string key that happens to be
  // the stringified database id once a POI has round-tripped through
  // `loadPOIs` — true for every landmark this popover can ever be anchored
  // to, since a marker only exists to click in the first place after that
  // round trip (`usePOIManager`'s own doc comment, point 1).
  const attachPoiId = poi ? Number(poi.id) : null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-[1100] w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      style={{ left: screenPosition.x, top: screenPosition.y }}
      role="dialog"
      aria-label={title}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {description && (
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}

      {/* Keyed by `zoneId` for a zone, `poiId` for a landmark — the only
          difference the T3 list itself takes as a discriminant. */}
      <PlaceEntityList
        target={entityListTarget}
        refreshKey={entitiesRefreshKey}
      />

      <div className="mb-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("attach")}
        </button>

        {place && (
          <>
            {/* No confirmation (§9's open question, agreed 2026-08-21) —
                unlike deletion (T6), un-placing doesn't destroy data. */}
            <button
              type="button"
              onClick={() => onUnplace(place)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {t("unplace")}
            </button>
            {/* "Rimuovi definitivamente" (T6) — the SPEC-010 deletion flow,
                behind the same confirmation dialog it has today
                (`DeletePlaceButton`, reused unchanged). */}
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {t("delete")}
            </button>
          </>
        )}

        {poi && (
          <>
            {/* "Modifica" (T7) — `WorldMap` opens `MapPOIPanel` in edit
                mode, pre-filled with this landmark. */}
            <button
              type="button"
              onClick={() => onEditLandmark(poi)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {t("editLandmark")}
            </button>
            {/* "Elimina" (T7) — no confirmation, matching the machinery it
                reuses (`usePOIManager.deletePOI`, already unconfirmed). */}
            <button
              type="button"
              onClick={() => onDeleteLandmark(poi)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {t("deleteLandmark")}
            </button>
          </>
        )}
      </div>

      {place && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={!hasMap}
            onClick={() => hasMap && onOpenMap(place)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
          >
            {t("openMap")}
          </button>
          {!hasMap && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("openMapUnavailable")}
            </p>
          )}
        </div>
      )}

      {/* Pre-filled with the clicked zone (or, for a landmark, its
          enclosing zone plus the landmark itself) rather than the map's
          currently-viewed parent (contrast `WorldMap`'s own mount of this
          component) — the popover's whole point is acting on the place
          under the click. */}
      <AttachEntityButton
        zoneId={place ? place.id : parentId}
        poiId={attachPoiId}
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        onAttached={() => setEntitiesRefreshKey((key) => key + 1)}
      />

      {/* "Rimuovi definitivamente" (T6) — reuses `DeletePlaceButton`
          unchanged, the same component `MapOptionsButton` opens for the
          place currently being viewed; here it targets the clicked place
          instead. Never rendered for the root, since the root never gets a
          popover in the first place (§5's edge cases) — `isRoot={false}` is
          therefore always correct here. Zone only. */}
      {place && (
        <DeletePlaceButton
          placeId={place.id}
          placeTitle={place.title}
          parentTitle={parentTitle}
          isRoot={false}
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
