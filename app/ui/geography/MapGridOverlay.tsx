"use client";

import { useEffect } from "react";
import type { Polyline } from "leaflet";
import { useLocale, useTranslations } from "next-intl";

import parseGridScale from "@/app/lib/config/geography/parseGridScale";
import {
  deriveGridRows,
  metersPerSquare,
  squareSizeInPixels,
} from "@/app/modules/maps/lib/utils/grid";
import { formatMeters } from "@/app/modules/maps/lib/utils/formatDistance";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";

interface MapGridOverlayProps {
  /** The toggle's state — owned by `WorldMap`, off on every load (§9). */
  isVisible: boolean;
  /** The stored configuration, both null until the DM sets one (§6). */
  gridColumns: number | null;
  gridScale: string | null;
  /**
   * The map image's natural pixel size, `null` until the browser reports
   * it. The grid draws in layer coordinates, which after TD-81 coincide
   * with these natural pixels (`computeImageBounds` frames every map as
   * `[[0,0],[naturalHeight,naturalWidth]]`) — so no bounds prop is needed.
   */
  imageSize: { width: number; height: number } | null;
}

/**
 * The grid overlay and its legend (SPEC-015 §5 steps 5–6). One Leaflet
 * multi-polyline holds every line — at most 200 columns (the validator's
 * cap, §5's performance mitigation) plus the derived rows — added to the
 * map while visible and removed on toggle-off, map change or unmount.
 * Non-interactive, so clicks pass through to the map beneath.
 *
 * Renders nothing at all unless the grid is configured, visible and the
 * image's size is known: a partial grid is never drawn from stale or
 * guessed dimensions.
 */
export default function MapGridOverlay({
  isVisible,
  gridColumns,
  gridScale,
  imageSize,
}: MapGridOverlayProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.gridLegend");
  const locale = useLocale();

  const scale = parseGridScale(gridScale);
  const squareSize =
    imageSize === null
      ? null
      : squareSizeInPixels(gridColumns, imageSize.width);

  useEffect(() => {
    if (
      !map ||
      !isVisible ||
      scale === null ||
      gridColumns === null ||
      imageSize === null ||
      squareSize === null
    ) {
      return;
    }

    let cancelled = false;
    let layer: Polyline | null = null;

    // Dynamic import in a `.then()` rather than an awaited async effect —
    // the same shape `WorldMap`'s bootstrap effect uses (TD-64).
    import("leaflet")
      .then((L) => {
        if (cancelled) return;

        // Layer coordinates are `[y, x]` (CRS.Simple, latitude-first).
        // Verticals land exactly on both image edges; horizontals stop at
        // the last whole multiple inside the image — the bottom edge is
        // the image's own boundary, and a rounded derived height (§5) is
        // a legend figure, not geometry.
        const lines: [number, number][][] = [];
        for (let k = 0; k <= gridColumns; k++) {
          const x = k * squareSize;
          lines.push([
            [0, x],
            [imageSize.height, x],
          ]);
        }
        const horizontalCount = Math.floor(
          imageSize.height / squareSize + 1e-9
        );
        for (let k = 0; k <= horizontalCount; k++) {
          const y = k * squareSize;
          lines.push([
            [y, 0],
            [y, imageSize.width],
          ]);
        }

        layer = L.polyline(lines, {
          color: "#0f172a",
          weight: 1,
          opacity: 0.4,
          interactive: false,
        });
        layer.addTo(map);
      })
      .catch((error: unknown) => {
        console.error("Failed to draw the map grid:", error);
      });

    return () => {
      cancelled = true;
      layer?.remove();
    };
  }, [map, isVisible, scale, gridColumns, imageSize, squareSize]);

  if (
    !isVisible ||
    scale === null ||
    gridColumns === null ||
    imageSize === null
  ) {
    return null;
  }

  const rows = deriveGridRows(gridColumns, imageSize.width, imageSize.height);
  if (rows === null) return null;

  const squareMeters = metersPerSquare(scale);

  return (
    <div className="absolute bottom-24 sm:bottom-8 left-4 z-[1000] rounded-lg bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 shadow-lg">
      <p>
        {t("squareEquals", { distance: formatMeters(squareMeters, locale) })}
      </p>
      <p>
        {t("totalSize", {
          columns: gridColumns,
          rows,
          width: formatMeters(gridColumns * squareMeters, locale),
          height: formatMeters(rows * squareMeters, locale),
        })}
      </p>
    </div>
  );
}
