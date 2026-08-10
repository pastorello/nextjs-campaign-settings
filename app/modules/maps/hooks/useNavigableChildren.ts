"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Marker } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import updateZonePosition from "@/app/lib/data/maps/updateZonePosition";
import { notifyError } from "@/app/lib/notifications/notify";
import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";
import type PlaceChild from "@/app/lib/definitions/interfaces/maps/PlaceChild";

export interface NavigableChild {
  id: number;
  title: string;
  lat: number;
  lng: number;
  // The child's own map — what `GeographyExplorer` needs to descend into it.
  // `null` for a positioned child that has never been given one (SPEC-007
  // T1): it is still reachable, just empty ground with an upload control on
  // it once `onDescend` fires, rather than a place to browse.
  mapImage: string | null;
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
 * A positioned child with no map of its own is included too (SPEC-007 T1) —
 * excluding it, the earlier behaviour, is exactly the bug SPEC-007 §1
 * describes: four branches were positioned but permanently unreachable
 * because nothing could ever click through to give them a map. It renders
 * with a distinct icon so the DM can tell "not drawn yet" from "drawn".
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
  const t = useTranslations("geography.errors");
  const [children, setChildren] = useState<NavigableChild[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const onDescendRef = useRef(onDescend);
  useEffect(() => {
    onDescendRef.current = onDescend;
  });

  // Reference kept fresh the same way `onDescendRef` is, for the same
  // reason: read from inside a Leaflet event handler created once per
  // marker, not re-bound on every render.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  // Readable synchronously, unlike `children` itself — React does not
  // guarantee a `setState` updater runs before the next line of caller
  // code, so `repositionChild` cannot read `previous` off it directly (the
  // same reason `usePOIManager` keeps `poisRef` alongside its own state).
  const childrenRef = useRef<NavigableChild[]>([]);
  useEffect(() => {
    childrenRef.current = children;
  }, [children]);

  /**
   * Repositions a navigable child on drag (TD-71, SPEC-005 §5.B) —
   * optimistic, matching `usePOIManager.updatePOI`'s revert-on-failure
   * shape, though simpler: there is no operation queue here, since a
   * navigable place has no create-then-immediately-drag race to guard
   * against (SPEC-005's picker positions it before any marker exists to
   * drag). Only ever sends `lat`/`lng` — never `category`, which would
   * silently write a `poi`-only field onto this row.
   */
  const repositionChild = useCallback(
    async (id: number, lat: number, lng: number) => {
      const previous = childrenRef.current.find((child) => child.id === id);
      if (!previous) return;

      setChildren((current) =>
        current.map((child) =>
          child.id === id ? { ...child, lat, lng } : child
        )
      );

      const revert = () => {
        setChildren((current) =>
          current.map((child) => (child.id === id ? previous : child))
        );
        notifyError(
          tRef.current("placePositionFailed", { title: previous.title })
        );
      };

      try {
        const result = await updateZonePosition({ id, lat, lng });
        if (!result.ok) revert();
      } catch (error) {
        console.error("Failed to reposition navigable place:", error);
        revert();
      }
    },
    []
  );

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
          } =>
            (NAVIGABLE_PLACE_KINDS as readonly string[]).includes(row.kind) &&
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
        // SPEC-007 T1 — grey/dashed for "positioned but no map of its own
        // yet" versus the solid green of an actually-drawn place, so the DM
        // can tell the two apart before clicking through.
        const hasMap = child.mapImage !== null;
        const marker = L.marker([child.lat, child.lng], {
          // TD-71, SPEC-005 §5.B — draggable to reposition.
          draggable: true,
          icon: L.divIcon({
            className: "custom-navigable-marker",
            html: `
          <div class="w-9 h-9 ${hasMap ? "bg-green-600" : "bg-gray-400 border-dashed"} border-3 border-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.3)] flex items-center justify-center cursor-pointer">
            <div class="text-base">${hasMap ? "🗺️" : "❔"}</div>
          </div>
        `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
        marker.bindTooltip(child.title);

        // A drop shouldn't also descend into the place just dragged —
        // Leaflet's own click suppression after a drag isn't a documented
        // guarantee across versions/touch, so this hook makes it explicit.
        // Scoped per marker (a plain closure variable, not a hook ref):
        // dragging one marker must never suppress a genuine click on
        // another.
        let justDragged = false;
        marker.on("dragend", () => {
          justDragged = true;
          const { lat, lng } = marker.getLatLng();
          void repositionChild(child.id, lat, lng);
          // Leaflet fires any synthetic post-drag click synchronously, in
          // the same tick as `dragend` — this clears the guard right after,
          // so a later, genuine click on the same marker still descends.
          setTimeout(() => {
            justDragged = false;
          }, 0);
        });
        marker.on("click", () => {
          if (justDragged) return;
          onDescendRef.current(child);
        });
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
  }, [map, children, repositionChild]);

  return children;
}
