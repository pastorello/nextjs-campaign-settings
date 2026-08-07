"use client";

import { useEffect, useRef, useState } from "react";
import type { Marker } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";
import type PlaceChild from "@/app/lib/definitions/interfaces/maps/PlaceChild";

export interface NavigableChild {
  id: number;
  title: string;
  lat: number;
  lng: number;
  // The child's own map — what `GeographyExplorer` needs to descend into it.
  mapImage: string;
  mapBounds: unknown;
  mapInitialView: unknown;
  mapInitialZoom: number | null;
}

/**
 * Renders the current place's navigable children (SPEC-004 §10 M7 — the fix
 * for the "clicking the material world does nothing" defect in §1; T2 widens
 * "navigable" from `region` alone to `NAVIGABLE_PLACE_KINDS`) as clickable
 * markers, calling `onDescend` when one is clicked.
 *
 * A navigable place is created through `MapPOIPanel`'s kind selector
 * (SPEC-004 M5), which doesn't touch this hook's own list —
 * `refetchToken` is how the panel's caller asks for a reload after a
 * successful create, the same way `parentId` changing already triggers one
 * when the DM descends.
 */
export function useNavigableChildren(
  parentId: number,
  onDescend: (child: NavigableChild) => void,
  refetchToken: number = 0
): NavigableChild[] {
  const map = useLeafletMap();
  const [children, setChildren] = useState<NavigableChild[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const onDescendRef = useRef(onDescend);
  useEffect(() => {
    onDescendRef.current = onDescend;
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchPlaceChildren(parentId);
        const navigable = rows.filter(
          (
            row
          ): row is PlaceChild & {
            lat: number;
            lng: number;
            mapImage: string;
          } =>
            (NAVIGABLE_PLACE_KINDS as readonly string[]).includes(row.kind) &&
            row.mapImage !== null &&
            row.lat !== null &&
            row.lng !== null
        );
        if (cancelled) return;
        setChildren(
          navigable.map((row) => ({
            id: row.id,
            title: row.title,
            lat: row.lat,
            lng: row.lng,
            mapImage: row.mapImage,
            mapBounds: row.mapBounds,
            mapInitialView: row.mapInitialView,
            mapInitialZoom: row.mapInitialZoom,
          }))
        );
      } catch (error) {
        console.error("Failed to load navigable places:", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [parentId, refetchToken]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const draw = async () => {
      const L = await import("leaflet");
      if (cancelled) return;

      markersRef.current.forEach((marker) => {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      });
      markersRef.current = [];

      for (const child of children) {
        const marker = L.marker([child.lat, child.lng], {
          icon: L.divIcon({
            className: "custom-navigable-marker",
            html: `
          <div class="w-9 h-9 bg-green-600 border-3 border-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.3)] flex items-center justify-center cursor-pointer">
            <div class="text-base">🗺️</div>
          </div>
        `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
        marker.bindTooltip(child.title);
        marker.on("click", () => onDescendRef.current(child));
        markersRef.current.push(marker);
      }
    };

    void draw();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      });
      markersRef.current = [];
    };
  }, [map, children]);

  return children;
}
