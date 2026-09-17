import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `WorldMap.test.tsx` covers this hook's framing arithmetic through the
// component (TD-81/TD-87/TD-121); these tests pin down the hook's own
// contract — what it returns, and when it does nothing at all.

const fakeMap = {
  setView: vi.fn(),
  setMinZoom: vi.fn(),
  setMaxZoom: vi.fn(),
  setMaxBounds: vi.fn(),
  fitBounds: vi.fn(),
  getBoundsZoom: vi.fn(() => -4),
  invalidateSize: vi.fn(),
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const addTo = vi.fn();
const remove = vi.fn();
let onLoad: (() => void) | undefined;
let natural: { naturalWidth?: number; naturalHeight?: number } = {};
const imageOverlay = vi.fn(() => ({
  addTo,
  remove,
  setBounds: vi.fn(),
  setOpacity: vi.fn(),
  getElement: () => natural,
  once: (event: string, cb: () => void) => {
    if (event === "load") onLoad = cb;
  },
}));
vi.mock("leaflet", () => ({
  imageOverlay: () => imageOverlay(),
  latLngBounds: (a: unknown, b: unknown) => [a, b],
}));

import { useMapImageOverlay } from "./useMapImageOverlay";

const bounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000],
];

function render(mapUrl: string) {
  const runWithoutClosing = vi.fn((fn: () => void) => fn());
  const hook = renderHook(() =>
    useMapImageOverlay({
      mapUrl,
      bounds,
      initialView: [500, 500],
      initialZoom: 1,
      runWithoutClosing,
    })
  );
  return { ...hook, runWithoutClosing };
}

describe("useMapImageOverlay (TD-127)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onLoad = undefined;
    natural = { naturalWidth: 2000, naturalHeight: 1000 };
  });

  it("loads nothing for a place with no map, and reports the stored bounds", async () => {
    const { result } = render("");

    // Give a (wrongly) started dynamic import the chance to resolve.
    await act(async () => {});
    expect(imageOverlay).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      effectiveBounds: bounds,
      imageSize: null,
    });
  });

  it("reports the image's natural size and fitted bounds once it loads", async () => {
    const { result, runWithoutClosing } = render("/maps/a.jpg");

    await waitFor(() => expect(addTo).toHaveBeenCalledWith(fakeMap));
    expect(result.current.imageSize).toBeNull();

    act(() => onLoad?.());

    expect(result.current.imageSize).toEqual({ width: 2000, height: 1000 });
    expect(result.current.effectiveBounds).not.toEqual(bounds);
    // Both the interim framing and the re-fit run inside the suppression.
    expect(runWithoutClosing).toHaveBeenCalledTimes(2);
  });

  it("keeps the stored bounds and an unknown size for an undecodable image", async () => {
    natural = {};
    const { result } = render("/maps/broken.jpg");

    await waitFor(() => expect(addTo).toHaveBeenCalled());
    act(() => onLoad?.());

    expect(result.current).toEqual({
      effectiveBounds: bounds,
      imageSize: null,
    });
  });
});
