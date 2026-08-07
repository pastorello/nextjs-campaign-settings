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
  { color: string; emoji: string }
> = {
  deity: { color: "#9333ea", emoji: "✨" },
  npc: { color: "#0891b2", emoji: "🧑" },
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
        const { color, emoji } = MARKER_ICON[child.linkedType];
        const config = getLinkableEntityTypeById(child.linkedType);

        const marker = L.marker([child.lat, child.lng], {
          icon: L.divIcon({
            className: "custom-linked-entity-marker",
            html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="font-size: 15px;">${emoji}</div>
          </div>
        `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          }),
        }).addTo(map);

        const popupContent = `
      <div style="min-width: 150px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(child.title)}</div>
        ${
          config
            ? `<a href="${config.path}?id=${child.linkedId}" style="font-size: 12px; color: #2563eb; text-decoration: underline; display: inline-block; margin-top: 4px;">View ${config.label}</a>`
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
