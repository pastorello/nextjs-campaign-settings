import { createElement, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Map as LeafletMapInstance } from "leaflet";

import { MapContext } from "@/app/modules/maps/contexts/MapContext";

const on = vi.fn();
const off = vi.fn();
const remove = vi.fn();
const invalidateSize = vi.fn();
const getCenter = vi.fn(() => ({ lat: -2.911154, lng: 120.074263 }));
const getZoom = vi.fn(() => 5);
const setView = vi.fn();
const getContainer = vi.fn(() => ({ style: {} }) as unknown as HTMLElement);
const fakeMapInstance = {
  on,
  off,
  remove,
  invalidateSize,
  getCenter,
  getZoom,
  setView,
  getContainer,
} as unknown as LeafletMapInstance;
const mapConstructor = vi.fn(
  (_container?: unknown, _options?: unknown) => fakeMapInstance
);

vi.mock("leaflet", () => ({
  map: (container: HTMLElement, options: unknown) =>
    mapConstructor(container, options),
  CRS: { Simple: "simple-crs" },
}));

import { LeafletMap } from "./LeafletMap";

function Wrapper({
  setMap,
  children,
}: {
  setMap: (map: LeafletMapInstance | null) => void;
  children: ReactNode;
}) {
  return createElement(
    MapContext.Provider,
    {
      value: {
        map: null,
        setMap,
        isReady: false,
        error: null,
        isInitializing: false,
        setMapError: vi.fn(),
        startInitializing: vi.fn(),
      },
    },
    children
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeafletMap", () => {
  it("throws outside a MapProvider", () => {
    const renderOutsideProvider = () => render(<LeafletMap />);
    expect(renderOutsideProvider).toThrow(
      "LeafletMap must be used within a MapProvider"
    );
  });

  it("initializes a Leaflet map with the default config and registers it via context", async () => {
    const setMap = vi.fn();
    render(
      <Wrapper setMap={setMap}>
        <LeafletMap />
      </Wrapper>
    );

    await waitFor(() => {
      expect(mapConstructor).toHaveBeenCalled();
    });

    expect(mapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        center: [-2.911154, 120.074263],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
        crs: "simple-crs",
      })
    );
    expect(setMap).toHaveBeenCalledWith(fakeMapInstance);
  });

  // The click-wiring effect's dependency array is [onClick], not tied to
  // whether the (async) map init has finished — so on first mount, with
  // mapRef.current still null, it wires nothing. It only attaches once
  // `onClick` changes identity on a later render, by which point the map is
  // ready. This is exactly what WorldMap.tsx relies on: its onClick handler
  // is a useCallback keyed on `isSelectingPOILocation`, so toggling location
  // selection is what makes the map start listening, not mounting alone.
  it("wires onClick to the map's click event once the handler identity changes after init", async () => {
    // Same `setMap` reference across both renders: `setMap` sits in the
    // init effect's dependency array (via `cleanupMap`), so a fresh
    // reference on rerender would tear the map down and re-init it,
    // masking the thing this test is about.
    const setMap = vi.fn();
    const onClick = vi.fn();
    const { rerender } = render(
      <Wrapper setMap={setMap}>
        <LeafletMap onClick={onClick} />
      </Wrapper>
    );

    await waitFor(() => expect(mapConstructor).toHaveBeenCalled());
    expect(on).not.toHaveBeenCalledWith("click", expect.any(Function));

    const onClickV2 = vi.fn();
    rerender(
      <Wrapper setMap={setMap}>
        <LeafletMap onClick={onClickV2} />
      </Wrapper>
    );

    await waitFor(() =>
      expect(on).toHaveBeenCalledWith("click", expect.any(Function))
    );
    const handler = on.mock.calls.find(([event]) => event === "click")?.[1] as
      ((e: { latlng: { lat: number; lng: number } }) => void) | undefined;
    handler?.({ latlng: { lat: 1, lng: 2 } });

    expect(onClickV2).toHaveBeenCalledWith(1, 2);
  });

  it("applies the cursor style to the map container once it changes after init", async () => {
    const container = { style: {} } as unknown as HTMLElement;
    getContainer.mockReturnValue(container);
    const setMap = vi.fn();

    const { rerender } = render(
      <Wrapper setMap={setMap}>
        <LeafletMap cursorStyle="grab" />
      </Wrapper>
    );

    await waitFor(() => expect(mapConstructor).toHaveBeenCalled());

    rerender(
      <Wrapper setMap={setMap}>
        <LeafletMap cursorStyle="crosshair" />
      </Wrapper>
    );

    await waitFor(() => expect(container.style.cursor).toBe("crosshair"));
  });

  it("renders its children alongside the map container", () => {
    render(
      <Wrapper setMap={vi.fn()}>
        <LeafletMap>
          <div data-testid="child" />
        </LeafletMap>
      </Wrapper>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("leaflet-map-container")).toBeInTheDocument();
  });

  it("removes the map instance on unmount", async () => {
    const setMap = vi.fn();
    const { unmount } = render(
      <Wrapper setMap={setMap}>
        <LeafletMap />
      </Wrapper>
    );

    await waitFor(() => expect(mapConstructor).toHaveBeenCalled());

    unmount();

    expect(remove).toHaveBeenCalled();
    expect(setMap).toHaveBeenLastCalledWith(null);
  });
});
