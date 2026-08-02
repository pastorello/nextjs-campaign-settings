import { createElement, ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Map as LeafletMap } from "leaflet";

import { MapContext } from "@/app/modules/maps/contexts/MapContext";
import { useMapControls } from "./useMapControls";

function wrapperWithMap(map: LeafletMap | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MapContext.Provider,
      {
        value: {
          map,
          setMap: vi.fn(),
          isReady: map !== null,
          error: null,
          isInitializing: false,
          setMapError: vi.fn(),
          startInitializing: vi.fn(),
        },
      },
      children
    );
  };
}

describe("useMapControls", () => {
  it("zoomIn/zoomOut/resetView are no-ops without a map", () => {
    const { result } = renderHook(() => useMapControls(), {
      wrapper: wrapperWithMap(null),
    });

    expect(() => result.current.zoomIn()).not.toThrow();
    expect(() => result.current.zoomOut()).not.toThrow();
    expect(() => result.current.resetView()).not.toThrow();
    expect(result.current.map).toBeNull();
  });

  it("zoomIn/zoomOut delegate to the map instance", () => {
    // Direct hoisted references, not `map.zoomIn` — asserting on a method
    // read off `map` trips `unbound-method`, same as elsewhere in this suite.
    const zoomIn = vi.fn();
    const zoomOut = vi.fn();
    const map = { zoomIn, zoomOut, setView: vi.fn() } as unknown as LeafletMap;

    const { result } = renderHook(() => useMapControls(), {
      wrapper: wrapperWithMap(map),
    });

    result.current.zoomIn();
    result.current.zoomOut();

    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).toHaveBeenCalled();
  });

  it("resetView sets the view back to the default center and zoom", () => {
    const setView = vi.fn();
    const map = {
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      setView,
    } as unknown as LeafletMap;

    const { result } = renderHook(() => useMapControls(), {
      wrapper: wrapperWithMap(map),
    });

    result.current.resetView();

    expect(setView).toHaveBeenCalledWith([-2.911154, 120.074263], 5);
  });
});
