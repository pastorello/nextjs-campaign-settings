import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (...args: unknown[]) => void;

function fakeMapFactory() {
  const handlers = new Map<string, Set<Handler>>();
  return {
    dragging: { enable: vi.fn(), disable: vi.fn() },
    hasLayer: vi.fn(() => true),
    removeLayer: vi.fn(),
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
type FakeMap = ReturnType<typeof fakeMapFactory>;

const { getMap, setMap } = vi.hoisted(() => {
  let current: unknown = null;
  return {
    getMap: () => current,
    setMap: (map: unknown) => {
      current = map;
    },
  };
});
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => getMap(),
}));

const rectangleSetBounds = vi.fn();
const rectangleAddTo = vi.fn();
const rectangle = vi.fn((..._args: unknown[]) => {
  const instance = { addTo: rectangleAddTo, setBounds: rectangleSetBounds };
  rectangleAddTo.mockReturnValue(instance);
  return instance;
});
const latLngBounds = vi.fn((box: [[number, number], [number, number]]) => {
  const [[lat1, lng1], [lat2, lng2]] = box;
  return {
    getSouth: () => Math.min(lat1, lat2),
    getNorth: () => Math.max(lat1, lat2),
    getWest: () => Math.min(lng1, lng2),
    getEast: () => Math.max(lng1, lng2),
  };
});
class FakeLatLngBounds {}
vi.mock("leaflet", () => ({
  rectangle: (...args: unknown[]) => rectangle(...args),
  latLngBounds: (...args: [[[number, number], [number, number]]]) =>
    latLngBounds(...args),
  LatLngBounds: FakeLatLngBounds,
}));

import { useDrawArea } from "./useDrawArea";

const BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [100, 100],
];

function mouseEvent(lat: number, lng: number, x: number, y: number) {
  return { latlng: { lat, lng }, containerPoint: { x, y } };
}

describe("useDrawArea", () => {
  let map: FakeMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = fakeMapFactory();
    setMap(map);
  });

  it("disables map dragging while enabled and restores it when disabled", async () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDrawArea({
          enabled,
          bounds: BOUNDS,
          onComplete: vi.fn(),
          onCancel: vi.fn(),
        }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => expect(map.dragging.disable).toHaveBeenCalled());

    rerender({ enabled: false });

    await waitFor(() => expect(map.dragging.enable).toHaveBeenCalled());
  });

  it("produces a footprint from the drawn corners on a genuine drag", async () => {
    const onComplete = vi.fn();
    renderHook(() =>
      useDrawArea({
        enabled: true,
        bounds: BOUNDS,
        onComplete,
        onCancel: vi.fn(),
      })
    );
    await waitFor(() =>
      expect(map.on).toHaveBeenCalledWith("mousedown", expect.any(Function))
    );

    map.emit("mousedown", mouseEvent(10, 10, 0, 0));
    map.emit("mousemove", mouseEvent(40, 45, 30, 35));
    map.emit("mouseup", mouseEvent(50, 60, 50, 60));

    expect(onComplete).toHaveBeenCalledWith([
      [10, 10],
      [50, 60],
    ]);
    expect(map.removeLayer).toHaveBeenCalled();
  });

  it("clamps each corner to the given bounds", async () => {
    const onComplete = vi.fn();
    renderHook(() =>
      useDrawArea({
        enabled: true,
        bounds: BOUNDS,
        onComplete,
        onCancel: vi.fn(),
      })
    );
    await waitFor(() =>
      expect(map.on).toHaveBeenCalledWith("mousedown", expect.any(Function))
    );

    map.emit("mousedown", mouseEvent(-20, -30, 0, 0));
    map.emit("mouseup", mouseEvent(150, 200, 80, 90));

    expect(onComplete).toHaveBeenCalledWith([
      [0, 0],
      [100, 100],
    ]);
  });

  it("treats a sub-threshold drag as a cancel, not a completed area", async () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    renderHook(() =>
      useDrawArea({ enabled: true, bounds: BOUNDS, onComplete, onCancel })
    );
    await waitFor(() =>
      expect(map.on).toHaveBeenCalledWith("mousedown", expect.any(Function))
    );

    map.emit("mousedown", mouseEvent(10, 10, 100, 100));
    map.emit("mouseup", mouseEvent(10.1, 10.1, 102, 101));

    expect(onCancel).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cancels and removes the temporary rectangle on Escape", async () => {
    const onCancel = vi.fn();
    renderHook(() =>
      useDrawArea({
        enabled: true,
        bounds: BOUNDS,
        onComplete: vi.fn(),
        onCancel,
      })
    );
    await waitFor(() =>
      expect(map.on).toHaveBeenCalledWith("mousedown", expect.any(Function))
    );

    map.emit("mousedown", mouseEvent(10, 10, 0, 0));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(map.removeLayer).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    renderHook(() =>
      useDrawArea({
        enabled: false,
        bounds: BOUNDS,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      })
    );

    expect(map.on).not.toHaveBeenCalled();
    expect(map.dragging.disable).not.toHaveBeenCalled();
  });
});
