"use client";

import { useEffect, useRef, useState } from "react";
import type { Marker } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
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
 * Renders the current place's navigable `region` children as clickable
 * markers, calling `onDescend` when one is clicked (SPEC-004 §10 M7 — the
 * fix for the "clicking the material world does nothing" defect in §1).
 *
 * A `region` can only be created through M5's panel work, which hasn't
 * shipped yet, so this list is empty in the running app today. It exists so
 * descending works correctly the moment a region can be created — the same
 * "not yet referenced" shape M1-M4 shipped in.
 */
export function useNavigableChildren(
  parentId: number,
  onDescend: (child: NavigableChild) => void
): NavigableChild[] {
  const map = useLeafletMap();
  const [children, setChildren] = useState<NavigableChild[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const onDescendRef = useRef(onDescend);
  onDescendRef.current = onDescend;

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
            row.kind === "region" &&
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
  }, [parentId]);

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
          <div style="
            width: 36px;
            height: 36px;
            background: #16a34a;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="font-size: 16px;">🗺️</div>
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
