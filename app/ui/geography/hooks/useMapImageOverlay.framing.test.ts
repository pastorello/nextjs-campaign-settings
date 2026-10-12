import * as L from "leaflet";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeImageBounds } from "@/app/modules/maps/lib/utils/placeMapView";

// TD-153, against real Leaflet: `useMapImageOverlay.test.ts` mocks the map, so
// it cannot see what Leaflet itself does when the bounds are applied. A
// `setMaxBounds` on a loaded map pans the centre inside the new bounds with an
// *animated* `panBy`; called before the view change, that slide started from a
// stale centre and could not be cancelled, so the map drifted ~380px down and
// back on every load. The container's size is faked because jsdom has no
// layout and Leaflet only animates a pan that fits in the container.
//
// `setView(…, { animate: false })` still goes through `panBy`, with
// `animate: false`; what must never happen is a `panBy` that animates.

let realMap: L.Map;
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => realMap,
}));

import { useMapImageOverlay } from "./useMapImageOverlay";

const bounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000],
];

let container: HTMLDivElement;

function sizedContainer(): HTMLDivElement {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientWidth", { value: 800 });
  Object.defineProperty(element, "clientHeight", { value: 600 });
  document.body.appendChild(element);
  return element;
}

function watchAnimatedPans(map: L.Map): () => unknown[] {
  const spy = vi.spyOn(map, "panBy");
  return () =>
    spy.mock.calls.filter(([, options]) => options?.animate !== false);
}

function mountHook() {
  return renderHook(() =>
    useMapImageOverlay({
      mapUrl: "/maps/world.png",
      bounds,
      initialView: [500, 500],
      initialZoom: 0,
      runWithoutClosing: (fn) => fn(),
    })
  );
}

describe("useMapImageOverlay framing (TD-153)", () => {
  let animatedPans: () => unknown[];

  beforeEach(() => {
    container = sizedContainer();
    // `LeafletMap`'s construction-time view: nowhere near the image's bounds.
    realMap = L.map(container, {
      center: [0, 0],
      zoom: 0,
      crs: L.CRS.Simple,
    });
    animatedPans = watchAnimatedPans(realMap);
  });

  afterEach(() => {
    realMap.remove();
    container.remove();
  });

  it("frames the stored view without panning toward the new bounds", async () => {
    mountHook();

    await waitFor(() =>
      expect(realMap.options.maxBounds).toBeInstanceOf(L.LatLngBounds)
    );

    expect(animatedPans()).toEqual([]);
    expect(realMap.getCenter().lat).toBeCloseTo(500);
    expect(realMap.getCenter().lng).toBeCloseTo(500);
  });

  it("re-fits to the loaded image without panning", async () => {
    mountHook();
    await waitFor(() =>
      expect(realMap.options.maxBounds).toBeInstanceOf(L.LatLngBounds)
    );

    const image = container.querySelector("img.leaflet-image-layer");
    if (!image) throw new Error("the image overlay was not added");
    Object.defineProperty(image, "naturalWidth", { value: 2000 });
    Object.defineProperty(image, "naturalHeight", { value: 1000 });
    image.dispatchEvent(new Event("load"));

    const [southWest, northEast] = computeImageBounds(2000, 1000) as [
      L.LatLngTuple,
      L.LatLngTuple,
    ];
    const fitted = L.latLngBounds(southWest, northEast);
    await waitFor(() => {
      const limit = realMap.options.maxBounds;
      expect(limit instanceof L.LatLngBounds && limit.equals(fitted)).toBe(
        true
      );
    });

    expect(animatedPans()).toEqual([]);
    expect(realMap.getCenter().lat).toBeCloseTo(fitted.getCenter().lat);
    expect(realMap.getCenter().lng).toBeCloseTo(fitted.getCenter().lng);
  });
});
