"use client";

import { useEffect, useRef } from "react";
import type { LeafletMouseEvent, Rectangle } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";

// Below this many pixels of on-screen drag, a mousedown/mouseup pair is a
// click, not an intent to draw — the same judgment `isDegenerateFootprint`
// makes server-side, applied before any footprint even exists.
const MIN_DRAG_PIXELS = 6;

export interface UseDrawAreaOptions {
  enabled: boolean;
  // The current map's own bounds — a drawn rectangle is clamped to this so
  // it "must not be storable outside the space it is drawn on" (SPEC-009
  // §5 edge cases). Not the rectangle being drawn; the space it's drawn on.
  bounds: L.LatLngBoundsExpression;
  onComplete: (footprint: Footprint) => void;
  // Fired when the hook aborts a gesture and wants the caller to disarm
  // (`enabled` back to `false`): Escape while armed, or a drag too small to
  // be an intent (`MIN_DRAG_PIXELS`). Never fired for a normal
  // `enabled` → `false` from the caller's own side — cleanup there is
  // silent, since the caller already knows.
  onCancel: () => void;
}

/**
 * Drag-to-draw a rectangle on the current map (SPEC-009 T2). No drawing
 * library exists in this project (no leaflet-draw/geoman in package.json) —
 * this is the same hand-rolled, imperative style the rest of
 * `app/modules/maps` already uses for Leaflet interaction
 * (`useMapContextMenu`, `useNavigableChildren`).
 *
 * While `enabled`, panning is disabled (`map.dragging`) so a left-drag draws
 * instead of panning: mousedown starts a temporary outline rectangle,
 * mousemove updates it live, mouseup finalizes it. Escape cancels at any
 * point. The temporary rectangle and the handlers are always cleaned up,
 * and dragging is always restored, when `enabled` goes back to `false` or
 * the component unmounts.
 */
export function useDrawArea({
  enabled,
  bounds,
  onComplete,
  onCancel,
}: UseDrawAreaOptions): void {
  const map = useLeafletMap();

  // Kept fresh without re-running the setup effect, the same pattern
  // `useNavigableChildren`'s `onDescendRef`/`tRef` use for the same reason:
  // read from inside a Leaflet handler attached once per `enabled` toggle.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });
  const boundsRef = useRef(bounds);
  useEffect(() => {
    boundsRef.current = bounds;
  });

  useEffect(() => {
    if (!map || !enabled) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    const setup = async () => {
      const L = await import("leaflet");
      if (cancelled) return;

      map.dragging.disable();

      const clamp = (latlng: { lat: number; lng: number }) => {
        const raw = boundsRef.current;
        const b = raw instanceof L.LatLngBounds ? raw : L.latLngBounds(raw);
        return {
          lat: Math.min(Math.max(latlng.lat, b.getSouth()), b.getNorth()),
          lng: Math.min(Math.max(latlng.lng, b.getWest()), b.getEast()),
        };
      };

      let start: { lat: number; lng: number } | null = null;
      let startPoint: { x: number; y: number } | null = null;
      let temp: Rectangle | null = null;

      const removeTemp = () => {
        if (temp && map.hasLayer(temp)) map.removeLayer(temp);
        temp = null;
        start = null;
        startPoint = null;
      };

      const handleMouseDown = (e: LeafletMouseEvent) => {
        start = clamp(e.latlng);
        startPoint = e.containerPoint;
        temp = L.rectangle(
          [
            [start.lat, start.lng],
            [start.lat, start.lng],
          ],
          { color: "#2563eb", weight: 2, dashArray: "6,4", fillOpacity: 0.08 }
        ).addTo(map);
      };

      const handleMouseMove = (e: LeafletMouseEvent) => {
        if (!start || !temp) return;
        const current = clamp(e.latlng);
        temp.setBounds([
          [start.lat, start.lng],
          [current.lat, current.lng],
        ]);
      };

      const handleMouseUp = (e: LeafletMouseEvent) => {
        if (!start || !startPoint) return;
        const current = clamp(e.latlng);
        const dragDistance = Math.hypot(
          e.containerPoint.x - startPoint.x,
          e.containerPoint.y - startPoint.y
        );
        const footprint: Footprint = [
          [start.lat, start.lng],
          [current.lat, current.lng],
        ];
        removeTemp();

        if (dragDistance < MIN_DRAG_PIXELS) {
          onCancelRef.current();
          return;
        }
        onCompleteRef.current(footprint);
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        removeTemp();
        onCancelRef.current();
      };

      map.on("mousedown", handleMouseDown);
      map.on("mousemove", handleMouseMove);
      map.on("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleEscape);

      teardown = () => {
        map.off("mousedown", handleMouseDown);
        map.off("mousemove", handleMouseMove);
        map.off("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleEscape);
        removeTemp();
        map.dragging.enable();
      };
    };

    void setup();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [map, enabled]);
}
