"use client";

import { useEffect, useRef, useState } from "react";
import type { Marker } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import { getLinkableEntityTypeById } from "@/app/modules/maps/constants/linkable-entities";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

export interface LinkedEntityChild {
  id: number;
  title: string;
  lat: number;
  lng: number;
  linkedType: LinkableEntityType;
  linkedId: number;
}

// `title` is free text a DM enters (`placeSchema`), then interpolated into
// marker popup HTML below — unlike `usePOIManager.createMarker`'s popup,
// which doesn't escape `poi.title`/`poi.description` either, this is new
// code and there's no reason to start it with the same gap.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MARKER_ICON: Record<
  LinkableEntityType,
  { bgClass: string; emoji: string }
> = {
  deity: { bgClass: "bg-purple-600", emoji: "✨" },
  npc: { bgClass: "bg-cyan-600", emoji: "🧑" },
};

/**
 * Renders this place's `deity`/`npc` children that have coordinates as
 * clickable markers (TD-70). `MapPOIPanel`'s "Add Place" flow (SPEC-004 M5)
 * lets a DM give a deity or NPC a position, but until this hook nothing ever
 * drew it on the map — there was no rendering path for these two kinds at
 * all, distinct from `useNavigableChildren`'s markers (a deity/npc has no
 * map of its own to descend into) and from `usePOIManager`'s `kind: "poi"`
 * markers (their own icon set, no CRUD here).
 */
export function useLinkedEntityMarkers(
  parentId: number,
  refetchToken: number = 0
): LinkedEntityChild[] {
  const map = useLeafletMap();
  const [children, setChildren] = useState<LinkedEntityChild[]>([]);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchPlaceChildren(parentId);
        const linked = rows.filter(
          (
            row
          ): row is typeof row & {
            lat: number;
            lng: number;
            linkedType: LinkableEntityType;
            linkedId: number;
          } =>
            (row.kind === "deity" || row.kind === "npc") &&
            row.lat !== null &&
            row.lng !== null &&
            row.linkedType !== null &&
            row.linkedId !== null
        );
        if (cancelled) return;
        setChildren(
          linked.map((row) => ({
            id: row.id,
            title: row.title,
            lat: row.lat,
            lng: row.lng,
            linkedType: row.linkedType,
            linkedId: row.linkedId,
          }))
        );
      } catch (error) {
        console.error("Failed to load linked entity places:", error);
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
        const { bgClass, emoji } = MARKER_ICON[child.linkedType];
        const config = getLinkableEntityTypeById(child.linkedType);

        // Leaflet renders `html` as raw markup outside React, so this can't
        // be JSX — but the string is still scanned by Tailwind's content
        // globs like any other `app/**` file, so it's still Tailwind
        // classes, never inline `style` (CLAUDE.md: no inline styles).
        const marker = L.marker([child.lat, child.lng], {
          icon: L.divIcon({
            className: "custom-linked-entity-marker",
            html: `
          <div class="w-8 h-8 ${bgClass} border-[3px] border-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div class="text-sm">${emoji}</div>
          </div>
        `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          }),
        }).addTo(map);

        const popupContent = `
      <div class="min-w-[150px]">
        <div class="font-semibold mb-1">${escapeHtml(child.title)}</div>
        ${
          config
            ? `<a href="${config.path}?id=${child.linkedId}" class="text-xs text-blue-600 underline inline-block mt-1">View ${config.label}</a>`
            : ""
        }
      </div>
    `;
        marker.bindPopup(popupContent);
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
