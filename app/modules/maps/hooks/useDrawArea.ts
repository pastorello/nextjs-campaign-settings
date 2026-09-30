"use client";

import { useEffect, useRef } from "react";
import type { LeafletMouseEvent } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import type { Footprint, Point } from "@/app/modules/maps/lib/utils/footprint";

/** Clicking this close to the first vertex closes the outline. */
const CLOSE_RADIUS_PX = 10;
/**
 * A double-click lands its own two clicks on the same spot before it
 * finishes the outline; consecutive vertices this close are one vertex.
 */
const DUPLICATE_RADIUS_PX = 3;
const MIN_VERTICES = 3;

export interface UseDrawAreaOptions {
  enabled: boolean;
  bounds: L.LatLngBoundsExpression;
  onComplete: (footprint: Footprint) => void;
  onCancel: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Draws an area's outline on the current map, one click per vertex
 * (SPEC-024 §5; a dragged rectangle before, SPEC-009 T2). No drawing library
 * exists in this project — this is the same hand-rolled, imperative style
 * the rest of `app/modules/maps` uses for Leaflet interaction.
 *
 * While `enabled`: each click adds a vertex, clamped to the map's bounds,
 * and the outline follows the cursor so the closing edge is always in view.
 * The outline closes on a click on its first vertex, a double-click, or
 * Enter — each only once there are three vertices, since fewer are not a
 * shape. Backspace removes the last vertex; Escape abandons the outline.
 * The map still pans on a drag (a click is a click only when the pointer
 * did not travel), but its double-click zoom is off, because double-click
 * finishes the outline. Everything is cleaned up and restored when
 * `enabled` goes back to `false` or the component unmounts.
 *
 * **Keyboard.** Vertices are placed with the pointer only: the keyboard
 * finishes, undoes and abandons an outline, but cannot place a vertex, as it
 * cannot place a click anywhere on these maps except the context menu's own
 * point. SPEC-024 §8 asks for that to be said plainly; §11 records it.
 */
export function useDrawArea({
  enabled,
  bounds,
  onComplete,
  onCancel,
}: UseDrawAreaOptions): void {
  const map = useLeafletMap();

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

      map.doubleClickZoom.disable();

      const clamp = (latlng: { lat: number; lng: number }): Point => {
        const raw = boundsRef.current;
        const b = raw instanceof L.LatLngBounds ? raw : L.latLngBounds(raw);
        return [
          Math.min(Math.max(latlng.lat, b.getSouth()), b.getNorth()),
          Math.min(Math.max(latlng.lng, b.getWest()), b.getEast()),
        ];
      };
      const pixelDistance = (a: Point, b: Point) => {
        const pa = map.latLngToContainerPoint(a);
        const pb = map.latLngToContainerPoint(b);
        return Math.hypot(pa.x - pb.x, pa.y - pb.y);
      };

      let vertices: Point[] = [];
      let cursor: Point | null = null;
      const outline = L.polygon([], {
        color: "#2563eb",
        weight: 2,
        dashArray: "6,4",
        fillOpacity: 0.08,
      }).addTo(map);
      let firstVertex: L.CircleMarker | null = null;

      const redraw = () => {
        outline.setLatLngs(cursor ? [...vertices, cursor] : vertices);
        const [first] = vertices;
        if (first && !firstVertex) {
          firstVertex = L.circleMarker(first, {
            radius: 6,
            color: "#2563eb",
            weight: 2,
            fillOpacity: 1,
          }).addTo(map);
        } else if (!first && firstVertex) {
          map.removeLayer(firstVertex);
          firstVertex = null;
        }
      };

      const reset = () => {
        vertices = [];
        cursor = null;
        redraw();
      };

      const withoutDuplicates = (points: Point[]) =>
        points.filter(
          (point, index) =>
            index === 0 ||
            pixelDistance(point, points[index - 1]!) > DUPLICATE_RADIUS_PX
        );

      const finish = () => {
        const ring = withoutDuplicates(vertices);
        if (ring.length < MIN_VERTICES) return;
        reset();
        onCompleteRef.current({ ring });
      };

      const handleClick = (e: LeafletMouseEvent) => {
        const point = clamp(e.latlng);
        const [first] = vertices;
        if (
          first &&
          withoutDuplicates(vertices).length >= MIN_VERTICES &&
          pixelDistance(point, first) <= CLOSE_RADIUS_PX
        ) {
          finish();
          return;
        }
        vertices = [...vertices, point];
        redraw();
      };

      const handleMouseMove = (e: LeafletMouseEvent) => {
        if (vertices.length === 0) return;
        cursor = clamp(e.latlng);
        redraw();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          reset();
          onCancelRef.current();
        } else if (e.key === "Enter" && !isTypingTarget(e.target)) {
          finish();
        } else if (
          e.key === "Backspace" &&
          vertices.length > 0 &&
          !isTypingTarget(e.target)
        ) {
          e.preventDefault();
          vertices = vertices.slice(0, -1);
          if (vertices.length === 0) cursor = null;
          redraw();
        }
      };

      map.on("click", handleClick);
      map.on("dblclick", finish);
      map.on("mousemove", handleMouseMove);
      document.addEventListener("keydown", handleKeyDown);

      teardown = () => {
        map.off("click", handleClick);
        map.off("dblclick", finish);
        map.off("mousemove", handleMouseMove);
        document.removeEventListener("keydown", handleKeyDown);
        if (map.hasLayer(outline)) map.removeLayer(outline);
        if (firstVertex && map.hasLayer(firstVertex)) {
          map.removeLayer(firstVertex);
        }
        map.doubleClickZoom.enable();
      };
    };

    void setup();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [map, enabled]);
}
