import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (...args: unknown[]) => void;

// One pixel per unit of lat/lng, so the pixel radii the hook uses read
// directly off the coordinates below.
function fakeMapFactory() {
  const handlers = new Map<string, Set<Handler>>();
  return {
    doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
    hasLayer: vi.fn(() => true),
    removeLayer: vi.fn(),
    latLngToContainerPoint: vi.fn(([lat, lng]: [number, number]) => ({
      x: lng,
      y: lat,
    })),
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

const setLatLngs = vi.fn();
const polygon = vi.fn((..._args: unknown[]) => {
  const instance = { addTo: () => instance, setLatLngs };
  return instance;
});
const circleMarker = vi.fn((..._args: unknown[]) => {
  const instance = { addTo: () => instance };
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
  polygon: (...args: unknown[]) => polygon(...args),
  circleMarker: (...args: unknown[]) => circleMarker(...args),
  latLngBounds: (...args: [[[number, number], [number, number]]]) =>
    latLngBounds(...args),
  LatLngBounds: FakeLatLngBounds,
}));

import { useDrawArea } from "./useDrawArea";

const BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [100, 100],
];

const click = (lat: number, lng: number) => ({ latlng: { lat, lng } });
const key = (value: string) =>
  document.dispatchEvent(new KeyboardEvent("keydown", { key: value }));

describe("useDrawArea (SPEC-024: one click per vertex)", () => {
  let map: FakeMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = fakeMapFactory();
    setMap(map);
  });

  async function arm(
    overrides: Partial<Parameters<typeof useDrawArea>[0]> = {}
  ) {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    const hook = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDrawArea({
          enabled,
          bounds: BOUNDS,
          onComplete,
          onCancel,
          ...overrides,
        }),
      { initialProps: { enabled: true } }
    );
    await waitFor(() =>
      expect(map.on).toHaveBeenCalledWith("click", expect.any(Function))
    );
    return { ...hook, onComplete, onCancel };
  }

  it("turns the double-click zoom off while drawing, and back on after", async () => {
    const { rerender } = await arm();
    expect(map.doubleClickZoom.disable).toHaveBeenCalled();

    rerender({ enabled: false });

    expect(map.doubleClickZoom.enable).toHaveBeenCalled();
  });

  it("adds a vertex per click and finishes on Enter", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));
    map.emit("click", click(50, 30));

    key("Enter");

    expect(onComplete).toHaveBeenCalledWith({
      ring: [
        [10, 10],
        [10, 50],
        [50, 30],
      ],
    });
  });

  it("cannot finish with fewer than three vertices", async () => {
    const { onComplete, onCancel } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));

    key("Enter");
    map.emit("dblclick");

    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("closes the outline on a click on its first vertex", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));
    map.emit("click", click(50, 30));

    map.emit("click", click(12, 13));

    expect(onComplete).toHaveBeenCalledWith({
      ring: [
        [10, 10],
        [10, 50],
        [50, 30],
      ],
    });
  });

  it("finishes on a double-click, keeping the vertex its own clicks placed once", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));
    // A double-click: two clicks on the same spot, then the dblclick.
    map.emit("click", click(50, 30));
    map.emit("click", click(50, 30));
    map.emit("dblclick");

    expect(onComplete).toHaveBeenCalledWith({
      ring: [
        [10, 10],
        [10, 50],
        [50, 30],
      ],
    });
  });

  it("takes back the last vertex on Backspace", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));
    map.emit("click", click(90, 90));
    key("Backspace");
    map.emit("click", click(50, 30));

    key("Enter");

    expect(onComplete).toHaveBeenCalledWith({
      ring: [
        [10, 10],
        [10, 50],
        [50, 30],
      ],
    });
  });

  it("abandons the outline on Escape", async () => {
    const { onComplete, onCancel } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));

    key("Escape");

    expect(onCancel).toHaveBeenCalled();
    expect(setLatLngs).toHaveBeenLastCalledWith([]);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("clamps every vertex to the map's bounds", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(-20, 10));
    map.emit("click", click(10, 150));
    map.emit("click", click(120, -5));

    key("Enter");

    expect(onComplete).toHaveBeenCalledWith({
      ring: [
        [0, 10],
        [10, 100],
        [100, 0],
      ],
    });
  });

  it("follows the cursor with the edge that would close the outline", async () => {
    await arm();
    map.emit("click", click(10, 10));
    map.emit("mousemove", click(40, 40));

    expect(setLatLngs).toHaveBeenLastCalledWith([
      [10, 10],
      [40, 40],
    ]);
  });

  it("leaves Enter and Backspace alone while a field has the focus", async () => {
    const { onComplete } = await arm();
    map.emit("click", click(10, 10));
    map.emit("click", click(10, 50));
    map.emit("click", click(50, 30));
    const input = document.createElement("input");
    document.body.appendChild(input);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );

    expect(onComplete).not.toHaveBeenCalled();
    input.remove();
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
  });
});
