import { createElement, ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Map as LeafletMap } from "leaflet";

import { MapContext } from "@/app/modules/maps/contexts/MapContext";
import { useSafeMapOperations } from "./useSafeMapOperations";

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

describe("useSafeMapOperations", () => {
  it("reports isReady false and returns defaults with no map", () => {
    const { result } = renderHook(() => useSafeMapOperations(), {
      wrapper: wrapperWithMap(null),
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.getZoom(9)).toBe(9);
    expect(result.current.getCenter([1, 2])).toEqual([1, 2]);
    expect(result.current.getBounds()).toBeNull();
    expect(result.current.setView([0, 0], 5)).toBe(false);
    expect(result.current.flyTo([0, 0], 5)).toBe(false);
    expect(result.current.fitBounds({} as never)).toBe(false);
    expect(result.current.zoomIn()).toBe(false);
    expect(result.current.zoomOut()).toBe(false);
    expect(result.current.invalidateSize()).toBe(false);
    expect(result.current.panTo([0, 0])).toBe(false);
  });

  it("delegates every operation to the map when one is present", () => {
    const map = {
      getZoom: () => 12,
      getCenter: () => ({ lat: 5, lng: 6 }),
      getBounds: () => "bounds",
      setView: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      invalidateSize: vi.fn(),
      panTo: vi.fn(),
    } as unknown as LeafletMap;

    const { result } = renderHook(() => useSafeMapOperations(), {
      wrapper: wrapperWithMap(map),
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.getZoom()).toBe(12);
    expect(result.current.getCenter()).toEqual([5, 6]);
    expect(result.current.getBounds()).toBe("bounds");
    expect(result.current.setView([0, 0], 5)).toBe(true);
    expect(result.current.flyTo([0, 0], 5)).toBe(true);
    expect(result.current.fitBounds({} as never)).toBe(true);
    expect(result.current.zoomIn()).toBe(true);
    expect(result.current.zoomOut()).toBe(true);
    expect(result.current.invalidateSize()).toBe(true);
    expect(result.current.panTo([0, 0])).toBe(true);
  });

  it("returns false/defaults instead of throwing when the map operation itself fails", () => {
    const map = {
      getZoom: () => {
        throw new Error("boom");
      },
      setView: () => {
        throw new Error("boom");
      },
    } as unknown as LeafletMap;

    const { result } = renderHook(() => useSafeMapOperations(), {
      wrapper: wrapperWithMap(map),
    });

    expect(result.current.getZoom(3)).toBe(3);
    expect(result.current.setView([0, 0], 5)).toBe(false);
  });
});
