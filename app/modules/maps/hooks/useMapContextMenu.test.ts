import { createElement, ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Map as LeafletMap } from "leaflet";

import { MapContext } from "@/app/modules/maps/contexts/MapContext";
import { useMapContextMenu } from "./useMapContextMenu";

/** A fake Leaflet map exposing just enough of on/off to drive the handlers. */
type Handler = (...args: unknown[]) => void;

function fakeMap() {
  const handlers = new Map<string, Set<Handler>>();

  return {
    on: vi.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: Handler) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((handler) => handler(...args));
    },
  };
}

function wrapperWithMap(map: LeafletMap) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MapContext.Provider,
      {
        value: {
          map,
          setMap: vi.fn(),
          isReady: true,
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

describe("useMapContextMenu", () => {
  it("starts closed with no position", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.position).toBeNull();
  });

  it("opens at the click position on a right-click", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    const preventDefault = vi.fn();
    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault },
        containerPoint: { x: 10, y: 20 },
        latlng: { lat: 1, lng: 2 },
      });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.position).toEqual({
      x: 10,
      y: 20,
      latlng: { lat: 1, lng: 2 },
    });
  });

  it("closes on a map click", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault: vi.fn() },
        containerPoint: { x: 0, y: 0 },
        latlng: { lat: 0, lng: 0 },
      });
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      map.emit("click");
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on a map movestart (e.g. the user dragging the map)", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault: vi.fn() },
        containerPoint: { x: 0, y: 0 },
        latlng: { lat: 0, lng: 0 },
      });
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      map.emit("movestart");
    });
    expect(result.current.isOpen).toBe(false);
  });

  // Regression: WorldMap's TD-81/TD-87 corrective re-fit calls
  // `map.fitBounds`/`setView` from an async callback (once a loaded image
  // reports its real aspect ratio) that can land at any point after mount —
  // including while a DM has just opened the right-click context menu (e.g.
  // right-click then immediately "Add Place", where CI's image fetch is
  // slow enough to overlap the click). Leaflet's `movestart` fires
  // identically for that programmatic move and a real drag; unguarded, it
  // closed the menu — and detached its trigger button — mid-click.
  // `runWithoutClosing` is how a caller opts a specific move out of that.
  it("does not close on a movestart caused by runWithoutClosing (a programmatic camera move, e.g. WorldMap's TD-81/TD-87 re-fit)", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault: vi.fn() },
        containerPoint: { x: 0, y: 0 },
        latlng: { lat: 0, lng: 0 },
      });
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.runWithoutClosing(() => {
        map.emit("movestart");
      });
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("resumes closing on movestart after runWithoutClosing finishes, even if the wrapped call threw", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault: vi.fn() },
        containerPoint: { x: 0, y: 0 },
        latlng: { lat: 0, lng: 0 },
      });
    });

    act(() => {
      expect(() =>
        result.current.runWithoutClosing(() => {
          throw new Error("boom");
        })
      ).toThrow("boom");
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      map.emit("movestart");
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on escape while open", () => {
    const map = fakeMap();
    const { result } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    act(() => {
      map.emit("contextmenu", {
        originalEvent: { preventDefault: vi.fn() },
        containerPoint: { x: 0, y: 0 },
        latlng: { lat: 0, lng: 0 },
      });
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("unregisters its map listeners on unmount", () => {
    const map = fakeMap();
    const { unmount } = renderHook(() => useMapContextMenu(), {
      wrapper: wrapperWithMap(map as unknown as LeafletMap),
    });

    expect(map.on).toHaveBeenCalledWith("contextmenu", expect.any(Function));
    unmount();

    expect(map.off).toHaveBeenCalledWith("contextmenu", expect.any(Function));
    expect(map.off).toHaveBeenCalledWith("click", expect.any(Function));
    expect(map.off).toHaveBeenCalledWith("movestart", expect.any(Function));
  });
});
