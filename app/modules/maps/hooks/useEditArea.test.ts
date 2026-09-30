import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Footprint, Point } from "@/app/modules/maps/lib/utils/footprint";

type Handler = (...args: unknown[]) => void;

function emitter() {
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

// One pixel per unit, y growing downwards as lat grows: close enough to a
// map for the arrow keys' pixel steps to read off the coordinates.
const fakeMap = {
  ...emitter(),
  dragging: { enable: vi.fn(), disable: vi.fn() },
  hasLayer: vi.fn(() => true),
  removeLayer: vi.fn(),
  latLngToContainerPoint: vi.fn(([lat, lng]: Point) => ({ x: lng, y: lat })),
  containerPointToLatLng: vi.fn(([x, y]: [number, number]) => ({
    lat: y,
    lng: x,
  })),
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

interface FakeMarker extends ReturnType<typeof emitter> {
  kind: string;
  element: HTMLElement;
  latlng: { lat: number; lng: number };
  getLatLng: () => { lat: number; lng: number };
  getElement: () => HTMLElement;
  addTo: () => FakeMarker;
}
let markers: FakeMarker[] = [];
let outlines: (ReturnType<typeof emitter> & {
  setLatLngs: ReturnType<typeof vi.fn>;
})[] = [];

vi.mock("leaflet", () => ({
  polygon: vi.fn(() => {
    const outline = { ...emitter(), setLatLngs: vi.fn(), addTo: () => outline };
    outlines.push(outline);
    return outline;
  }),
  marker: vi.fn(
    ([lat, lng]: Point, options: { icon: { className: string } }) => {
      const element = document.createElement("div");
      element.tabIndex = 0;
      document.body.appendChild(element);
      const marker: FakeMarker = {
        ...emitter(),
        kind: options.icon.className,
        element,
        latlng: { lat, lng },
        getLatLng: () => marker.latlng,
        getElement: () => element,
        addTo: () => marker,
      };
      markers.push(marker);
      return marker;
    }
  ),
  divIcon: vi.fn((options: unknown) => options),
  latLngBounds: vi.fn((box: [Point, Point]) => {
    const [[lat1, lng1], [lat2, lng2]] = box;
    return {
      getSouth: () => Math.min(lat1, lat2),
      getNorth: () => Math.max(lat1, lat2),
      getWest: () => Math.min(lng1, lng2),
      getEast: () => Math.max(lng1, lng2),
    };
  }),
  LatLngBounds: class {},
  DomEvent: { stop: vi.fn() },
}));

import { useEditArea } from "./useEditArea";

const BOUNDS: [Point, Point] = [
  [0, 0],
  [100, 100],
];
const square: Footprint = {
  ring: [
    [10, 10],
    [10, 50],
    [50, 50],
    [50, 10],
  ],
};
const labels = {
  vertex: (n: number, total: number) => `vertex ${n}/${total}`,
  midpoint: (a: number, b: number) => `add ${a}-${b}`,
  centre: "centre",
};

const handles = (kind: string) =>
  markers.filter((marker) => marker.kind === `area-edit-${kind}`);

function arm(initial = { footprint: square, centre: [30, 30] as Point }) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const hook = renderHook(() =>
    useEditArea({
      enabled: true,
      initial,
      bounds: BOUNDS,
      labels,
      onSave,
      onCancel,
    })
  );
  return { ...hook, onSave, onCancel };
}

/** The handles of the latest render, once they exist. */
async function settled(vertexCount: number) {
  await waitFor(() => expect(handles("vertex").length).toBe(vertexCount));
}

function resetLayers() {
  markers.forEach((marker) => marker.element.remove());
  markers = [];
  outlines = [];
}

describe("useEditArea (SPEC-024 T5, T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLayers();
  });

  // Each re-render rebuilds the handles; only the newest set is live.
  const rebuilt = async (vertexCount: number) => {
    resetLayers();
    await settled(vertexCount);
  };

  it("puts a named handle on every vertex, every edge's midpoint and the centre", async () => {
    arm();
    await settled(4);

    expect(
      handles("vertex").map((m) => m.element.getAttribute("aria-label"))
    ).toEqual(["vertex 1/4", "vertex 2/4", "vertex 3/4", "vertex 4/4"]);
    expect(handles("midpoint")).toHaveLength(4);
    expect(handles("centre")[0]!.element.getAttribute("aria-label")).toBe(
      "centre"
    );
  });

  it("moves a vertex dragged, and saves the new outline with the centre", async () => {
    const { result, onSave } = arm();
    await settled(4);

    const third = handles("vertex")[2]!;
    third.latlng = { lat: 70, lng: 60 };
    act(() => third.emit("dragend"));
    await rebuilt(4);
    act(() => result.current.save());

    expect(onSave).toHaveBeenCalledWith(
      {
        ring: [
          [10, 10],
          [10, 50],
          [70, 60],
          [50, 10],
        ],
      },
      [30, 30]
    );
  });

  it("adds a vertex on the edge whose '+' is clicked", async () => {
    const { result, onSave } = arm();
    await settled(4);

    act(() => handles("midpoint")[0]!.emit("click"));
    await rebuilt(5);
    act(() => result.current.save());

    expect((onSave.mock.calls[0]![0] as Footprint).ring).toEqual([
      [10, 10],
      [10, 30],
      [10, 50],
      [50, 50],
      [50, 10],
    ]);
  });

  it("removes a right-clicked vertex, but never below three", async () => {
    const { result, onSave } = arm();
    await settled(4);

    act(() => handles("vertex")[3]!.emit("contextmenu", { originalEvent: {} }));
    await rebuilt(3);
    act(() => handles("vertex")[0]!.emit("contextmenu", { originalEvent: {} }));
    act(() => result.current.save());

    expect((onSave.mock.calls[0]![0] as Footprint).ring).toEqual([
      [10, 10],
      [10, 50],
      [50, 50],
    ]);
  });

  it("moves a vertex with the arrows and keeps the focus on it", async () => {
    const { result, onSave } = arm();
    await settled(4);

    act(() => {
      handles("vertex")[1]!.element.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    });
    await rebuilt(4);
    await waitFor(() =>
      expect(document.activeElement).toBe(handles("vertex")[1]!.element)
    );
    act(() => result.current.save());

    expect((onSave.mock.calls[0]![0] as Footprint).ring[1]).toEqual([10, 55]);
  });

  it("removes a vertex with Delete", async () => {
    const { result, onSave } = arm();
    await settled(4);

    act(() => {
      handles("vertex")[0]!.element.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Delete", bubbles: true })
      );
    });
    await rebuilt(3);
    act(() => result.current.save());

    expect((onSave.mock.calls[0]![0] as Footprint).ring).toHaveLength(3);
  });

  it("places the centre where it is dropped inside the outline", async () => {
    const { result, onSave } = arm();
    await settled(4);

    const centre = handles("centre")[0]!;
    centre.latlng = { lat: 15, lng: 45 };
    act(() => centre.emit("dragend"));
    await rebuilt(4);
    act(() => result.current.save());

    expect(onSave.mock.calls[0]![1]).toEqual([15, 45]);
  });

  it("puts the centre back when it is dropped outside the outline", async () => {
    const { result, onSave } = arm();
    await settled(4);

    const centre = handles("centre")[0]!;
    centre.latlng = { lat: 90, lng: 90 };
    act(() => centre.emit("dragend"));
    await rebuilt(4);
    act(() => result.current.save());

    expect(onSave.mock.calls[0]![1]).toEqual([30, 30]);
  });

  it("moves the centre into view when an edit leaves it outside", async () => {
    const { result, onSave } = arm({ footprint: square, centre: [45, 45] });
    await settled(4);

    // Removing the corner at (50, 50) cuts the centre off.
    act(() => handles("vertex")[2]!.emit("contextmenu", { originalEvent: {} }));
    await rebuilt(3);
    act(() => result.current.save());

    const [footprint, centre] = onSave.mock.calls[0]! as [Footprint, Point];
    const { footprintContains } =
      await import("@/app/modules/maps/lib/utils/footprint");
    expect(footprintContains(footprint, centre)).toBe(true);
  });

  it("moves the whole shape, centre included, and stops at the map's edge", async () => {
    const { result, onSave } = arm();
    await settled(4);

    act(() =>
      outlines.at(-1)!.emit("mousedown", { latlng: { lat: 20, lng: 20 } })
    );
    act(() => fakeMap.emit("mousemove", { latlng: { lat: 20, lng: -40 } }));
    act(() => fakeMap.emit("mouseup"));
    await rebuilt(4);
    act(() => result.current.save());

    // Wanted 60 to the left; the shape's west edge was 10 from the map's.
    expect(onSave).toHaveBeenCalledWith(
      {
        ring: [
          [10, 0],
          [10, 40],
          [50, 40],
          [50, 0],
        ],
      },
      [30, 20]
    );
    expect(fakeMap.dragging.enable).toHaveBeenCalled();
  });

  it("saves on Enter and abandons on Escape, but not from a text field", async () => {
    const { onSave, onCancel } = arm();
    await settled(4);
    const input = document.createElement("input");
    document.body.appendChild(input);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    expect(onSave).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCancel).toHaveBeenCalled();
    input.remove();
  });

  it("draws nothing while disabled", () => {
    renderHook(() =>
      useEditArea({
        enabled: false,
        initial: { footprint: square, centre: [30, 30] },
        bounds: BOUNDS,
        labels,
        onSave: vi.fn(),
        onCancel: vi.fn(),
      })
    );

    expect(markers).toHaveLength(0);
  });
});
