"use client";

import { useEffect } from "react";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";

/**
 * Draws the position the place form currently holds (TD-149) — SPEC-025
 * §5.2's "typing in them moves the marker": the fields and the map are two
 * views of one value, so a position typed as percentages shows up on the map
 * before it is saved, and a map click that fills the fields shows up too.
 *
 * `null` draws nothing: the form is closed, holds no position yet, or is
 * placing an area, whose drawn rectangle already shows where it goes.
 *
 * Deliberately inert — not interactive, not focusable, hidden from assistive
 * technology: the fields announce the position, and a second tab stop for
 * the same value would only repeat them. Recreated on every change rather
 * than moved, since the dynamic `import("leaflet")` makes an in-place update
 * race the creation it would update.
 */
export function useFormPositionMarker(
  position: { lat: number; lng: number } | null
): void {
  const map = useLeafletMap();

  useEffect(() => {
    if (!map || position === null) return;

    let marker: L.Marker | null = null;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled) return;
      marker = L.marker([position.lat, position.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "form-position-marker",
          html: `<div class="w-6 h-6 rounded-full border-[3px] border-dashed border-blue-600 bg-blue-600/20 shadow-[0_3px_8px_rgba(0,0,0,0.3)]" aria-hidden="true"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
    });

    return () => {
      cancelled = true;
      marker?.remove();
    };
  }, [map, position]);
}
