import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPlaceChildren, updateZonePosition } = vi.hoisted(() => ({
  fetchPlaceChildren: vi.fn(),
  updateZonePosition: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchPlaceChildren", () => ({
  default: fetchPlaceChildren,
}));
vi.mock("@/app/lib/data/maps/updateZonePosition", () => ({
  default: updateZonePosition,
}));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess: vi.fn(),
}));

// `next-intl` is already mocked globally in vitest.setup.ts (echoes the
// key back), which is enough for this hook's one `t()` call.

const fakeMap = {
  hasLayer: vi.fn(() => true),
  removeLayer: vi.fn(),
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const clickHandlers = new Map<unknown, () => void>();
const dragendHandlers = new Map<unknown, () => void>();
const markerAddTo = vi.fn();
const markerBindTooltip = vi.fn();
const markerGetLatLng = vi.fn(() => ({ lat: 99, lng: 88 }));
const marker = vi.fn((..._args: unknown[]) => {
  const instance = {
    addTo: markerAddTo,
    bindTooltip: markerBindTooltip,
    getLatLng: markerGetLatLng,
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "click") clickHandlers.set(instance, handler);
      if (event === "dragend") dragendHandlers.set(instance, handler);
    }),
  };
  markerAddTo.mockReturnValue(instance);
  return instance;
});

const rectangleClickHandlers = new Map<unknown, () => void>();
const rectangleAddTo = vi.fn();
const rectangleBindTooltip = vi.fn();
const rectangle = vi.fn((..._args: unknown[]) => {
  const instance = {
    addTo: rectangleAddTo,
    bindTooltip: rectangleBindTooltip,
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "click") rectangleClickHandlers.set(instance, handler);
    }),
  };
  rectangleAddTo.mockReturnValue(instance);
  return instance;
});
vi.mock("leaflet", () => ({
  marker: (...args: unknown[]) => marker(...args),
  rectangle: (...args: unknown[]) => rectangle(...args),
  divIcon: vi.fn(() => ({})),
}));

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    title: "Kingdom of Kang",
    description: null,
    kind: "region",
    lat: 10,
    lng: 20,
    category: null,
    mapImage: "kang.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    footprint: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

import { useNavigableChildren } from "./useNavigableChildren";

describe("useNavigableChildren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers.clear();
    dragendHandlers.clear();
    updateZonePosition.mockResolvedValue({ ok: true });
  });

  it("fetches this place's children scoped by parentId", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    renderHook(() => useNavigableChildren(42, vi.fn()));

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledWith(42));
  });

  it("refetches when refetchToken changes, e.g. after MapPOIPanel creates a region", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ token }: { token: number }) =>
        useNavigableChildren(42, vi.fn(), token),
      { initialProps: { token: 0 } }
    );
    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(1));

    rerender({ token: 1 });

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(2));
  });

  it("exposes only navigable kinds — not poi", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region" }),
      row({ id: 2, kind: "poi", category: "religion", mapImage: null }),
      row({ id: 5, kind: "plane" }),
      row({ id: 6, kind: "city" }),
      row({ id: 7, kind: "dungeon" }),
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(result.current).toHaveLength(4));
    expect(result.current.map((c) => c.id)).toEqual([1, 5, 6, 7]);
  });

  it("includes a positioned child with no map of its own yet (SPEC-007 T1)", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region" }),
      row({ id: 4, kind: "region", mapImage: null }),
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.find((c) => c.id === 4)).toMatchObject({
      mapImage: null,
    });
  });

  it("excludes a mapless child that has not been positioned yet", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region" }),
      row({ id: 4, kind: "region", mapImage: null, lat: null, lng: null }),
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current.map((c) => c.id)).toEqual([1]);
  });

  it("adds a marker to the map for each navigable child", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() =>
      expect(marker).toHaveBeenCalledWith([10, 20], expect.any(Object))
    );
    expect(markerAddTo).toHaveBeenCalledWith(fakeMap);
  });

  it("calls onPlaceClick with the child when its marker is clicked", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 7, title: "Kang" })]);
    const onPlaceClick = vi.fn();

    renderHook(() => useNavigableChildren(1, onPlaceClick));

    await waitFor(() => expect(clickHandlers.size).toBe(1));
    const handler = [...clickHandlers.values()][0];
    handler?.();

    expect(onPlaceClick).toHaveBeenCalledWith({
      id: 7,
      title: "Kang",
      description: null,
      lat: 10,
      lng: 20,
      mapImage: "kang.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
      footprint: null,
    });
  });
});

describe("useNavigableChildren — areas (SPEC-009 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers.clear();
    dragendHandlers.clear();
    rectangleClickHandlers.clear();
    updateZonePosition.mockResolvedValue({ ok: true });
  });

  it("renders a child with a footprint as a rectangle, not a marker", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({
        id: 3,
        title: "Kingdom of Kang",
        footprint: [
          [0, 0],
          [10, 20],
        ],
      }),
    ]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() =>
      expect(rectangle).toHaveBeenCalledWith(
        [
          [0, 0],
          [10, 20],
        ],
        expect.any(Object)
      )
    );
    expect(rectangleAddTo).toHaveBeenCalledWith(fakeMap);
    expect(marker).not.toHaveBeenCalled();
  });

  it("binds a permanent, centered tooltip with the area's title", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({
        id: 3,
        title: "Kingdom of Kang",
        footprint: [
          [0, 0],
          [10, 20],
        ],
      }),
    ]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(rectangleBindTooltip).toHaveBeenCalled());
    expect(rectangleBindTooltip).toHaveBeenCalledWith(
      "Kingdom of Kang",
      expect.objectContaining({ permanent: true, direction: "center" })
    );
  });

  it("calls onPlaceClick with the child when the area is clicked", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({
        id: 3,
        title: "Kingdom of Kang",
        footprint: [
          [0, 0],
          [10, 20],
        ],
      }),
    ]);
    const onPlaceClick = vi.fn();

    renderHook(() => useNavigableChildren(1, onPlaceClick));

    await waitFor(() => expect(rectangleClickHandlers.size).toBe(1));
    rectangleClickHandlers.values().next().value?.();

    expect(onPlaceClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, title: "Kingdom of Kang" })
    );
  });

  it("still renders a point child (no footprint) as a marker", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1, footprint: null })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(marker).toHaveBeenCalled());
    expect(rectangle).not.toHaveBeenCalled();
  });

  it("hides the area matching editingChildId while its redraw gesture is armed (SPEC-009 T5)", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({
        id: 3,
        title: "Kingdom of Kang",
        footprint: [
          [0, 0],
          [10, 20],
        ],
      }),
      row({
        id: 4,
        title: "Orc Kingdom",
        footprint: [
          [30, 30],
          [40, 40],
        ],
      }),
    ]);

    renderHook(() => useNavigableChildren(1, vi.fn(), 0, 3));

    await waitFor(() => expect(rectangle).toHaveBeenCalledTimes(1));
    expect(rectangle).toHaveBeenCalledWith(
      [
        [30, 30],
        [40, 40],
      ],
      expect.any(Object)
    );
  });

  it("shows the area again once editingChildId no longer matches it", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({
        id: 3,
        title: "Kingdom of Kang",
        footprint: [
          [0, 0],
          [10, 20],
        ],
      }),
    ]);

    const { rerender } = renderHook<void, { editingId: number | null }>(
      ({ editingId }) => useNavigableChildren(1, vi.fn(), 0, editingId),
      { initialProps: { editingId: 3 } }
    );
    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(1));
    // The only child is excluded by `editingChildId`, so there is no
    // positive call to synchronize on the way the other tests in this file
    // do (wait for `marker`/`rectangle`, then assert the other one wasn't
    // called). Flushing microtasks here lets the draw effect's dynamic
    // `import("leaflet")` and its skip-pass actually settle before the
    // rerender below starts a second, overlapping effect instance — without
    // this the assertion above passed vacuously before the first draw had
    // run, and the two instances raced (source of an intermittent CI
    // failure, 2026-08-13).
    await act(async () => {});
    expect(rectangle).not.toHaveBeenCalled();

    rerender({ editingId: null });

    await waitFor(() => expect(rectangle).toHaveBeenCalledTimes(1));
  });
});

describe("useNavigableChildren — drag to reposition (TD-71, SPEC-005 §5.B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers.clear();
    dragendHandlers.clear();
    updateZonePosition.mockResolvedValue({ ok: true });
  });

  it("renders the marker as draggable", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(marker).toHaveBeenCalled());
    const options = marker.mock.calls[0]?.[1] as { draggable?: boolean };
    expect(options.draggable).toBe(true);
  });

  it("sends id/lat/lng on drop, never category", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      await Promise.resolve();
    });

    await waitFor(() =>
      // A drag is a reposition, never a placement (TD-93) — this row is
      // already on the map by definition, so it goes to
      // `updateZonePosition` and never to `placeZone` (SPEC-017 T3).
      expect(updateZonePosition).toHaveBeenCalledWith({
        id: 1,
        lat: 99,
        lng: 88,
      })
    );
  });

  it("does not call onPlaceClick for the click Leaflet may fire right after a drag", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);
    const onPlaceClick = vi.fn();

    renderHook(() => useNavigableChildren(1, onPlaceClick));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      clickHandlers.values().next().value?.();
      await Promise.resolve();
    });

    expect(onPlaceClick).not.toHaveBeenCalled();
  });

  it("still calls onPlaceClick on a genuine click with no preceding drag", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);
    const onPlaceClick = vi.fn();

    renderHook(() => useNavigableChildren(1, onPlaceClick));
    await waitFor(() => expect(clickHandlers.size).toBe(1));

    clickHandlers.values().next().value?.();

    expect(onPlaceClick).toHaveBeenCalled();
  });

  it("reverts the position and notifies when the server rejects the drag", async () => {
    updateZonePosition.mockResolvedValue({ ok: false });
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, title: "Kang", lat: 10, lng: 20 }),
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("placePositionFailed")
    );
    expect(result.current[0]).toMatchObject({ lat: 10, lng: 20 });
  });
});
