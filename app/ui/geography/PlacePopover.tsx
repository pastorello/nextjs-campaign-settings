"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
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
 * and "Apri mappa"; the entities list, attach control and the zone/landmark
 * action pairs land on top of it in later tasks (T3-T7).
 *
 * Tracks the map's own `move`/`zoom` events to stay anchored to the clicked
 * place's `lat`/`lng` while the DM pans, rather than closing on any map
 * movement the way `MapContextMenu` does — a popover the DM is reading is
 * worth keeping open through a small pan, unlike a menu whose position only
 * ever mattered for the single click that opened it.
 */
export default function PlacePopover({
  place,
  onClose,
  onOpenMap,
}: PlacePopoverProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.popover");
  const popoverRef = useRef<HTMLDivElement>(null);
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
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
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
    </div>
  );
}
