"use client";

import { useEffect, useState } from "react";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import isValidString from "@/app/lib/utils/validators/isValidString";
import {
  computeImageBounds,
  computeMinZoom,
} from "@/app/modules/maps/lib/utils/placeMapView";

/**
 * Loads the place's map image as a Leaflet image overlay and frames the map
 * around it (TD-81/TD-87/TD-121) — extracted from `WorldMap` (TD-127).
 *
 * Returns the two values the rest of `WorldMap` reads back from the loaded
 * image: the bounds actually framing the map, and the image's natural size.
 * `runWithoutClosing` is `useMapContextMenu`'s — every view change here runs
 * inside it so it can never close a context menu the DM has open.
 */
export function useMapImageOverlay({
  mapUrl,
  bounds,
  initialView,
  initialZoom,
  runWithoutClosing,
}: {
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
  runWithoutClosing: (fn: () => void) => void;
}): {
  effectiveBounds: L.LatLngBoundsExpression;
  imageSize: { width: number; height: number } | null;
} {
  const map = useLeafletMap();
  const [currentImage, setCurrentImage] = useState<L.ImageOverlay | null>(null);
  // The bounds actually framing the map right now — starts as the
  // stored/default `bounds` prop and is corrected once the loaded image
  // reports its real pixel dimensions (TD-81/TD-87). Kept in state, not
  // derived inline, because both of `WorldMap`'s `useDrawArea` instances need the
  // corrected value too: clamping a drawn rectangle to the old default
  // square while the visible image is a different aspect ratio would let
  // the DM draw outside what the map actually shows.
  const [effectiveBounds, setEffectiveBounds] =
    useState<L.LatLngBoundsExpression>(bounds);
  // The loaded image's natural pixel size (SPEC-015 T5) — `null` until the
  // browser reports it, and reset on every map change, so the grid panel's
  // derived height renders as `—` rather than a number computed from a
  // previous map's aspect ratio.
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // A blank `mapUrl` is a legitimate state now (SPEC-007 T1) — a
    // positioned place that has never been given a map of its own renders
    // as empty ground with `MapUploadControl` on it, not an error.
    if (!isValidString(mapUrl)) return;

    let cancelled = false;

    // The dynamic `import()` is the only genuinely async step; everything
    // that follows (building the overlay, committing state) runs in this
    // `.then()` callback rather than after an `await` inside an async
    // function passed straight to the effect — the shape the React Compiler
    // lint rule can actually see through (TD-64).
    import("leaflet")
      .then((L) => {
        if (cancelled) return;

        // Remove existing image overlay if present
        if (currentImage && map) {
          currentImage.remove();
          setCurrentImage(null);
        }

        // The previous map's dimensions say nothing about this one —
        // unknown again until the new image reports its own (SPEC-015 T5).
        setImageSize(null);

        // Framed with the stored/default bounds and hidden (opacity 0)
        // until the image itself reports its real pixel dimensions
        // (TD-81) — the stored `mapBounds` is a hardcoded square today
        // (nothing writes it yet, see the module doc comment in
        // `placeMapView.ts`), so painting it before correction would
        // stretch a non-square image on one axis for however long the
        // fetch takes.
        const image = L.imageOverlay(mapUrl, bounds, { opacity: 0 });

        if (map) {
          image.addTo(map);
          setCurrentImage(image);
          setEffectiveBounds(bounds);

          // Interim framing before the image's own dimensions are known —
          // the same stored/default view this component has always opened
          // with. Corrected below once the image reports its real size.
          //
          // TD-87: the floor must be measured, not pinned to a constant —
          // `getBoundsZoom` reports the zoom at which the image fills the
          // container, but it clamps its own answer to whatever
          // minZoom/maxZoom the map *currently* has (`LeafletMap`'s
          // tile-map default of 3 the very first time this effect runs, or
          // a previous render's own computed floor on any later one), so
          // the floor is loosened first or the "fit" would just echo the
          // old floor back unchanged.
          //
          // `setView` fires Leaflet's `zoomstart` whenever it changes the
          // zoom — wrapped in `runWithoutClosing` so it can never be mistaken
          // for the DM zooming the map and close a context menu that happens
          // to be open (unlikely for this interim call, which runs at mount,
          // but the corrective re-fit below is exactly this situation and the
          // two are kept consistent).
          runWithoutClosing(() => {
            map.setMinZoom(-Infinity);
            // TD-121: `LeafletMap`'s own `invalidateSize` (its mount effect)
            // runs on a `requestAnimationFrame` + 100ms delay "to ensure
            // proper tile rendering" — a vendored, generic reason that has
            // nothing to do with *this* framing. `getBoundsZoom` below reads
            // Leaflet's cached container size, and if that timer hasn't
            // fired yet the cache still reflects whatever size the
            // container had (or hadn't finished laying out to) at
            // construction — every DM's actual report of this bug ("the
            // image took about half the canvas") is that stale-cache race,
            // not a wrong padding value. Forcing a fresh measurement here,
            // right before it's read, makes the fit correct regardless of
            // whether that other timer has fired yet.
            map.invalidateSize({ animate: false });
            const minZoom = computeMinZoom(
              map.getBoundsZoom(bounds),
              initialZoom
            );
            map.setMinZoom(minZoom);
            map.setMaxZoom(10);
            map.setMaxBounds(bounds);
            // `animate: false`, and not only because an animated initial
            // framing is pointless: `runWithoutClosing`'s suppression window
            // is synchronous, and Leaflet defers an *animated* zoom's
            // `zoomstart` into a `requestAnimFrame` (`_tryAnimatedZoom`) —
            // outside the window, where it would close a context menu the DM
            // has meanwhile opened. With `animate: false` the whole view
            // change, `zoomstart` included, runs inside the suppression.
            //
            // This reasoning used to be written in terms of `movestart` and
            // the pan `setMaxBounds`'s `panInsideMaxBounds` hook makes on the
            // deferred `moveend` — the cascade CI caught, where the menu
            // detached ~100ms after opening. That cascade still happens;
            // since TD-100 the menu simply does not listen to it any more,
            // which is why the argument for `animate: false` is now the zoom
            // rather than the pan.
            map.setView(initialView, initialZoom, { animate: false });
          });

          image.once("load", () => {
            if (cancelled) return;

            const element = image.getElement();
            const naturalWidth = element?.naturalWidth;
            const naturalHeight = element?.naturalHeight;
            // A broken/undecodable image has no natural size to frame
            // against — fall back to the stored/default bounds rather than
            // computing nonsense from zeros.
            const fittedBounds =
              naturalWidth && naturalHeight
                ? computeImageBounds(naturalWidth, naturalHeight)
                : bounds;
            // Same guard as above: a broken image keeps the aspect ratio
            // unknown, so the grid panel's derived height stays `—`.
            setImageSize(
              naturalWidth && naturalHeight
                ? { width: naturalWidth, height: naturalHeight }
                : null
            );

            // `ImageOverlay.setBounds` requires an actual `L.LatLngBounds`
            // instance, unlike the constructor and `Map.fitBounds`/
            // `setMaxBounds`, which accept the plain tuple form directly —
            // `fittedBounds` is always that plain 2-corner tuple in
            // practice (from `computeImageBounds` or the stored/default
            // `bounds` prop, never an existing `LatLngBounds` instance).
            const [southWest, northEast] = fittedBounds as [
              L.LatLngTuple,
              L.LatLngTuple,
            ];
            image.setBounds(L.latLngBounds(southWest, northEast));
            image.setOpacity(1);
            setEffectiveBounds(fittedBounds);

            // TD-87, same reasoning as the interim framing above: the
            // floor is re-measured against the corrected bounds (fixing
            // bounds without re-fitting the floor to match would leave the
            // floor stale, still measured against the stored/default
            // square) — loosened first so `getBoundsZoom` reports the real
            // fit rather than the floor just set above. `fitBounds` below
            // is what the map is about to open at, so it doubles as its
            // own `openZoom`.
            //
            // This whole re-fit is wrapped in `runWithoutClosing`: it fires
            // whenever the browser finishes loading the image, which is
            // asynchronous and can land well after mount — including while
            // a DM has the right-click context menu open. `fitBounds`
            // changes the zoom, and Leaflet fires `zoomstart` for that
            // exactly as it does for the DM's own wheel or pinch, so
            // unwrapped it closed the menu (and detached its "Aggiungi
            // luogo" button) mid-click in CI, a real regression this fixes
            // rather than a flaky test.
            runWithoutClosing(() => {
              map.setMinZoom(-Infinity);
              // TD-121, same reasoning as the interim framing above — the
              // image's `load` event is exactly the asynchronous case where
              // `LeafletMap`'s own delayed `invalidateSize` may not have
              // fired yet.
              map.invalidateSize({ animate: false });
              const fitZoom = map.getBoundsZoom(fittedBounds);
              map.setMinZoom(computeMinZoom(fitZoom, fitZoom));
              map.setMaxBounds(fittedBounds);
              // Same `animate: false` reasoning as the interim framing
              // above — this re-fit is the case that actually bit in CI.
              map.fitBounds(fittedBounds, { animate: false });
            });
          });
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to initialize map image:", error);
      });

    return () => {
      cancelled = true;
    };
    // `currentImage` is read (to remove the previous overlay) and set by this
    // effect; adding it to the dependency list would re-run the effect every
    // time it sets that state, reloading the same map image in an infinite
    // loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentImage intentionally omitted to prevent infinite loop
  }, [map, mapUrl]);

  return { effectiveBounds, imageSize };
}
