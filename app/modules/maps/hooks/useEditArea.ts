"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LeafletEvent, LeafletMouseEvent } from "leaflet";

import { useLeafletMap } from "./useLeafletMap";
import {
  footprintCentre,
  footprintContains,
  type Footprint,
  type Point,
} from "@/app/modules/maps/lib/utils/footprint";

const MIN_VERTICES = 3;
/** One arrow press moves a handle this far; with Shift, four times as far. */
const NUDGE_PX = 5;

/** The area being edited: its outline and the centre its label sits on. */
export interface EditableArea {
  footprint: Footprint;
  centre: Point;
}

/** Accessible names for the handles, resolved by the caller (ADR-0007). */
export interface EditAreaLabels {
  vertex: (index: number, total: number) => string;
  midpoint: (from: number, to: number) => string;
  centre: string;
}

export interface UseEditAreaOptions {
  enabled: boolean;
  /** Seeds the editor each time a new area is armed. */
  initial: EditableArea | null;
  bounds: L.LatLngBoundsExpression;
  labels: EditAreaLabels;
  onSave: (footprint: Footprint, centre: Point) => void;
  onCancel: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * Edits an existing area's outline in place (SPEC-024 T5) and moves the
 * point its label sits on (T6) — the counterpart of `useDrawArea`, which
 * draws an outline from nothing.
 *
 * While `enabled`, the outline is drawn with a handle on every vertex, a
 * "+" handle on every edge's midpoint and one on the centre:
 *
 * - **drag a vertex** to move it; **drag the shape** to move all of it;
 * - **click a "+"** to add a vertex there, which can then be dragged;
 * - **right-click a vertex** (or Delete on it) to remove it, never below
 *   three;
 * - **drag the centre** to place the label, which only lands inside the
 *   outline — dropped outside, it goes back. When an edit leaves it
 *   outside, it moves to the new outline's own centre, in view, before
 *   anything is saved: never recomputed behind the DM's back.
 *
 * **The keyboard edits too** (TD-133's standard): every handle is in the
 * tab order with a name; arrows move a vertex or the centre (Shift for
 * larger steps), Delete removes a vertex, Enter on a "+" adds one. Enter
 * elsewhere saves, Escape abandons the edit.
 *
 * Vertices stay inside the map's bounds, and moving the whole shape stops
 * at them rather than squashing it. Saving hands the outline and centre to
 * `onSave`; the server runs every placement check again.
 */
export function useEditArea({
  enabled,
  initial,
  bounds,
  labels,
  onSave,
  onCancel,
}: UseEditAreaOptions): { save: () => void } {
  const map = useLeafletMap();

  const [ring, setRing] = useState<Point[] | null>(null);
  const [centre, setCentre] = useState<Point | null>(null);

  // Seeded when an area is armed, forgotten when disarmed — the "adjusting
  // state during render" pattern `WorldMap` uses, rather than an effect.
  const [seededFrom, setSeededFrom] = useState<EditableArea | null>(null);
  if (enabled && initial && seededFrom !== initial) {
    setSeededFrom(initial);
    setRing(initial.footprint.ring);
    setCentre(initial.centre);
  }
  if ((!enabled || !initial) && seededFrom !== null) {
    setSeededFrom(null);
    setRing(null);
    setCentre(null);
  }

  // The handles are rebuilt after every edit, so the one the keyboard was
  // on is focused again once it exists — otherwise every arrow press would
  // drop the focus and a keyboard edit could only ever be one step.
  const refocus = useRef<{ kind: "vertex" | "centre"; index: number } | null>(
    null
  );

  const latest = useRef({ ring, centre, bounds, labels, onSave, onCancel });
  useEffect(() => {
    latest.current = { ring, centre, bounds, labels, onSave, onCancel };
  });

  const save = useCallback(() => {
    const { ring: current, centre: currentCentre } = latest.current;
    if (!current || !currentCentre) return;
    latest.current.onSave({ ring: current }, currentCentre);
  }, []);

  // Enter saves and Escape abandons, from anywhere but a text field. The
  // handles stop their own keys, so Enter on a "+" adds a vertex instead.
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") latest.current.onCancel();
      else if (e.key === "Enter") save();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, save]);

  useEffect(() => {
    if (!map || !enabled || !ring || !centre) return;

    let cancelled = false;
    const layers: L.Layer[] = [];
    let endBodyDrag: (() => void) | null = null;

    void import("leaflet").then((L) => {
      if (cancelled) return;

      const b = (() => {
        const raw = latest.current.bounds;
        return raw instanceof L.LatLngBounds ? raw : L.latLngBounds(raw);
      })();
      const clamp = ([lat, lng]: Point): Point => [
        Math.min(Math.max(lat, b.getSouth()), b.getNorth()),
        Math.min(Math.max(lng, b.getWest()), b.getEast()),
      ];
      const toPoint = (latlng: { lat: number; lng: number }): Point => [
        latlng.lat,
        latlng.lng,
      ];
      const nudged = (point: Point, e: KeyboardEvent): Point | null => {
        const direction = ARROWS[e.key];
        if (!direction) return null;
        const step = NUDGE_PX * (e.shiftKey ? 4 : 1);
        const pixel = map.latLngToContainerPoint(point);
        return clamp(
          toPoint(
            map.containerPointToLatLng([
              pixel.x + direction[0] * step,
              pixel.y + direction[1] * step,
            ])
          )
        );
      };

      // A new outline keeps the centre if it still contains it, and moves
      // it to its own centre — visibly, before saving — if it does not.
      const commitRing = (next: Point[]) => {
        const clamped = next.map(clamp);
        setRing(clamped);
        setCentre((current) =>
          current && footprintContains({ ring: clamped }, current)
            ? current
            : footprintCentre({ ring: clamped })
        );
      };
      const removeVertex = (index: number) => {
        if (ring.length <= MIN_VERTICES) return;
        commitRing(ring.filter((_, i) => i !== index));
      };
      const focusIfWanted = (
        layer: L.Marker,
        kind: "vertex" | "centre",
        index: number
      ) => {
        const wanted = refocus.current;
        if (wanted?.kind === kind && wanted.index === index) {
          refocus.current = null;
          layer.getElement()?.focus();
        }
      };

      const handleIcon = (className: string, html: string) =>
        L.divIcon({ className, html, iconSize: [14, 14], iconAnchor: [7, 7] });
      const onKeys = (
        layer: L.Marker,
        handler: (e: KeyboardEvent) => boolean
      ) => {
        layer.getElement()?.addEventListener("keydown", (e) => {
          if (handler(e)) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      };
      const name = (layer: L.Marker, label: string) => {
        const element = layer.getElement();
        element?.setAttribute("aria-label", label);
        element?.setAttribute("role", "button");
      };

      const outline = L.polygon(ring, {
        color: "#2563eb",
        weight: 2,
        dashArray: "6,4",
        fillOpacity: 0.12,
      }).addTo(map);
      layers.push(outline);

      // Drag the whole shape: panning is paused while the pointer is down,
      // and the move stops at the map's edges instead of squashing it.
      outline.on("mousedown", (e: LeafletEvent) => {
        const start = toPoint((e as LeafletMouseEvent).latlng);
        const lats = ring.map((p) => p[0]);
        const lngs = ring.map((p) => p[1]);
        const range = {
          minLat: b.getSouth() - Math.min(...lats),
          maxLat: b.getNorth() - Math.max(...lats),
          minLng: b.getWest() - Math.min(...lngs),
          maxLng: b.getEast() - Math.max(...lngs),
        };
        let delta: Point = [0, 0];
        const shift = (p: Point): Point => [p[0] + delta[0], p[1] + delta[1]];
        map.dragging.disable();
        const move = (event: LeafletEvent) => {
          const at = toPoint((event as LeafletMouseEvent).latlng);
          delta = [
            Math.min(Math.max(at[0] - start[0], range.minLat), range.maxLat),
            Math.min(Math.max(at[1] - start[1], range.minLng), range.maxLng),
          ];
          outline.setLatLngs(ring.map(shift));
        };
        const end = () => {
          map.off("mousemove", move);
          map.off("mouseup", end);
          map.dragging.enable();
          endBodyDrag = null;
          if (delta[0] === 0 && delta[1] === 0) return;
          setRing(ring.map(shift));
          setCentre((current) => (current ? shift(current) : current));
        };
        map.on("mousemove", move);
        map.on("mouseup", end);
        endBodyDrag = end;
      });

      ring.forEach((vertex, index) => {
        const handle = L.marker(vertex, {
          draggable: true,
          keyboard: true,
          icon: handleIcon(
            "area-edit-vertex",
            '<div class="h-3.5 w-3.5 rounded-sm border-2 border-blue-600 bg-white shadow"></div>'
          ),
        }).addTo(map);
        layers.push(handle);
        name(handle, latest.current.labels.vertex(index + 1, ring.length));
        handle.on("drag", () => {
          const moved = clamp(toPoint(handle.getLatLng()));
          outline.setLatLngs(ring.map((p, i) => (i === index ? moved : p)));
        });
        handle.on("dragend", () => {
          const moved = toPoint(handle.getLatLng());
          commitRing(ring.map((p, i) => (i === index ? moved : p)));
        });
        // Stopped, not only prevented: the map's own context menu would
        // otherwise open over the vertex being removed.
        handle.on("contextmenu", (e: LeafletEvent) => {
          L.DomEvent.stop((e as LeafletMouseEvent).originalEvent);
          removeVertex(index);
        });
        onKeys(handle, (e) => {
          if (e.key === "Delete" || e.key === "Backspace") {
            refocus.current = { kind: "vertex", index: Math.max(0, index - 1) };
            removeVertex(index);
            return true;
          }
          const moved = nudged(vertex, e);
          if (!moved) return false;
          refocus.current = { kind: "vertex", index };
          commitRing(ring.map((p, i) => (i === index ? moved : p)));
          return true;
        });
        focusIfWanted(handle, "vertex", index);
      });

      ring.forEach((vertex, index) => {
        const nextIndex = (index + 1) % ring.length;
        const next = ring[nextIndex]!;
        const mid: Point = [
          (vertex[0] + next[0]) / 2,
          (vertex[1] + next[1]) / 2,
        ];
        const handle = L.marker(mid, {
          keyboard: true,
          icon: handleIcon(
            "area-edit-midpoint",
            '<div class="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-blue-600 bg-white text-[10px] leading-none text-blue-700 shadow" aria-hidden="true">+</div>'
          ),
        }).addTo(map);
        layers.push(handle);
        name(handle, latest.current.labels.midpoint(index + 1, nextIndex + 1));
        const insert = () =>
          commitRing([
            ...ring.slice(0, index + 1),
            mid,
            ...ring.slice(index + 1),
          ]);
        handle.on("click", insert);
        onKeys(handle, (e) => {
          if (e.key !== "Enter" && e.key !== " ") return false;
          // The new vertex takes the focus, ready for the arrows.
          refocus.current = { kind: "vertex", index: index + 1 };
          insert();
          return true;
        });
      });

      const centreHandle = L.marker(centre, {
        draggable: true,
        keyboard: true,
        icon: handleIcon(
          "area-edit-centre",
          '<div class="h-3.5 w-3.5 rotate-45 border-2 border-emerald-600 bg-emerald-200 shadow"></div>'
        ),
      }).addTo(map);
      layers.push(centreHandle);
      name(centreHandle, latest.current.labels.centre);
      const placeCentre = (point: Point) => {
        // Outside the outline it goes back where it was: a label belongs
        // inside its area (SPEC-024 §5).
        setCentre(
          footprintContains({ ring }, point) ? point : ([...centre] as Point)
        );
      };
      centreHandle.on("dragend", () =>
        placeCentre(toPoint(centreHandle.getLatLng()))
      );
      onKeys(centreHandle, (e) => {
        const moved = nudged(centre, e);
        if (!moved) return false;
        refocus.current = { kind: "centre", index: 0 };
        placeCentre(moved);
        return true;
      });
      focusIfWanted(centreHandle, "centre", 0);
    });

    return () => {
      cancelled = true;
      endBodyDrag?.();
      for (const layer of layers) {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    };
  }, [map, enabled, ring, centre]);

  return { save };
}
