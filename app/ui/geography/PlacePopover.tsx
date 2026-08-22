"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import PlaceEntityList from "@/app/ui/geography/PlaceEntityList";
import AttachEntityButton from "@/app/ui/geography/AttachEntityButton";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";

interface PlacePopoverProps {
  place: NavigableChild;
  onClose: () => void;
  onOpenMap: (place: NavigableChild) => void;
}

/**
 * The place popover (SPEC-016) — anchored to the marker or rectangle the DM
 * clicked, replacing the old click-to-descend behaviour
 * (`useNavigableChildren`, T2). This shell carries the title, description
 * and "Apri mappa", plus the entities present at the place (T3) and the
 * attach control (T4); the zone/landmark action pairs land on top of it in
 * later tasks (T5-T7).
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
 * assigned beyond an id.
 */
export default function PlacePopover({
  place,
  onClose,
  onOpenMap,
}: PlacePopoverProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.popover");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [entitiesRefreshKey, setEntitiesRefreshKey] = useState(0);
  const [screenPosition, setScreenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!map) return;

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([place.lat, place.lng]);
      setScreenPosition({ x: point.x, y: point.y });
    };

    updatePosition();
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);
    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, place.lat, place.lng]);

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

  const hasMap = place.mapImage !== null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-[1100] w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      style={{ left: screenPosition.x, top: screenPosition.y }}
      role="dialog"
      aria-label={place.title}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {place.title}
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

      {place.description && (
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {place.description}
        </p>
      )}

      {/* A navigable child is a zone, so the list is always keyed by
          `zoneId` here; the landmark variant passes `poiId` instead (T7). */}
      <PlaceEntityList
        target={{ zoneId: place.id }}
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
      </div>

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

      {/* Pre-filled with the clicked zone, not the map's currently-viewed
          parent (contrast `WorldMap`'s own mount of this component) — the
          popover's whole point is acting on the place under the click. */}
      <AttachEntityButton
        zoneId={place.id}
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        onAttached={() => setEntitiesRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
