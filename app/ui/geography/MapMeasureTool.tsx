"use client";

import { useEffect } from "react";
import type { CircleMarker, LeafletMouseEvent, Polyline } from "leaflet";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import parseGridScale from "@/app/lib/config/geography/parseGridScale";
import { measureDistanceInMeters } from "@/app/modules/maps/lib/utils/grid";
import { formatMeters } from "@/app/modules/maps/lib/utils/formatDistance";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";

interface MapMeasureToolProps {
  /**
   * Armed from `MapContextMenu`'s "measure" entry — `WorldMap` owns the
   * state and only arms it when the grid is configured and the image's
   * size is known (§5's edge-case table: without a grid, measurement is
   * unavailable with an explanation, never started).
   */
  isActive: boolean;
  gridColumns: number | null;
  gridScale: string | null;
  imageSize: { width: number; height: number } | null;
  onExit: () => void;
}

const TRACK_STYLE = {
  color: "#dc2626",
  weight: 3,
  opacity: 0.9,
  interactive: false,
} as const;

const POINT_STYLE = {
  radius: 5,
  color: "#dc2626",
  weight: 2,
  fillColor: "#dc2626",
  fillOpacity: 0.8,
  interactive: false,
} as const;

/**
 * Click–track–click distance measurement (SPEC-015 §5 step 7, the DM's own
 * interaction): one click starts, the track draws in red as the mouse
 * moves, a second click ends it and drops a marker labelled with the
 * distance in the map's units. A further click starts a new measurement
 * and clears the previous one; Esc (or the banner's close button) exits
 * and clears everything.
 *
 * The distance comes from `measureDistanceInMeters` — Euclidean in the
 * map's own pixel space, then squares, then the scale's metres. This is
 * the rebuild that retires TD-94's haversine path: a `CRS.Simple` map is
 * not on a globe, and no haversine metre can come out of it any more.
 */
export default function MapMeasureTool({
  isActive,
  gridColumns,
  gridScale,
  imageSize,
  onExit,
}: MapMeasureToolProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.measure");
  const locale = useLocale();

  const scale = parseGridScale(gridScale);

  useEffect(() => {
    if (
      !map ||
      !isActive ||
      scale === null ||
      gridColumns === null ||
      imageSize === null
    ) {
      return;
    }

    let cancelled = false;
    // The in-flight measurement's start point, `[y, x]` layer coordinates
    // (CRS.Simple, latitude-first) — `null` between measurements.
    let start: [number, number] | null = null;
    let track: Polyline | null = null;
    let startMarker: CircleMarker | null = null;
    let endMarker: CircleMarker | null = null;
    let leaflet: typeof import("leaflet") | null = null;

    const clearLayers = () => {
      track?.remove();
      track = null;
      startMarker?.remove();
      startMarker = null;
      endMarker?.remove();
      endMarker = null;
    };

    const handleClick = (event: LeafletMouseEvent) => {
      if (!leaflet) return;
      const point: [number, number] = [event.latlng.lat, event.latlng.lng];

      if (start === null) {
        // First click — a new measurement replaces the previous result.
        clearLayers();
        start = point;
        startMarker = leaflet.circleMarker(event.latlng, POINT_STYLE);
        startMarker.addTo(map);
        track = leaflet.polyline([point, point], TRACK_STYLE);
        track.addTo(map);
        return;
      }

      // Second click — end the track, drop the labelled marker.
      track?.setLatLngs([start, point]);
      const meters = measureDistanceInMeters(
        start,
        point,
        gridColumns,
        imageSize.width,
        scale
      );
      endMarker = leaflet.circleMarker(event.latlng, POINT_STYLE);
      endMarker.addTo(map);
      if (meters !== null) {
        endMarker
          .bindTooltip(formatMeters(meters, locale), {
            permanent: true,
            direction: "top",
          })
          .openTooltip();
      }
      start = null;
    };

    const handleMouseMove = (event: LeafletMouseEvent) => {
      if (start !== null && track !== null) {
        track.setLatLngs([start, [event.latlng.lat, event.latlng.lng]]);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };

    // Dynamic import in a `.then()` rather than an awaited async effect —
    // the same shape `WorldMap`'s bootstrap effect uses (TD-64).
    import("leaflet")
      .then((L) => {
        if (cancelled) return;
        leaflet = L;
        map.on("click", handleClick);
        map.on("mousemove", handleMouseMove);
        document.addEventListener("keydown", handleKeyDown);
      })
      .catch((error: unknown) => {
        console.error("Failed to start measurement:", error);
      });

    return () => {
      cancelled = true;
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
      clearLayers();
    };
  }, [map, isActive, scale, gridColumns, imageSize, locale, onExit]);

  if (!isActive) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-lg bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 shadow-lg">
      <span>{t("hint")}</span>
      <button
        onClick={onExit}
        aria-label={t("exit")}
        title={t("exit")}
        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-slate-600"
      >
        <X className="h-4 w-4 text-gray-600 dark:text-gray-100" />
      </button>
    </div>
  );
}
