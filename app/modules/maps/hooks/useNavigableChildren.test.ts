import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPlaceChildren, updatePoi } = vi.hoisted(() => ({
  fetchPlaceChildren: vi.fn(),
  updatePoi: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchPlaceChildren", () => ({
  default: fetchPlaceChildren,
}));
vi.mock("@/app/lib/data/maps/updatePoi", () => ({ default: updatePoi }));

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
vi.mock("leaflet", () => ({
  marker: (...args: unknown[]) => marker(...args),
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
    linkedType: null,
    linkedId: null,
    mapImage: "kang.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
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
    updatePoi.mockResolvedValue({ ok: true });
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

  it("exposes only navigable children — not poi, deity or npc kinds", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region" }),
      row({ id: 2, kind: "poi", category: "religion", mapImage: null }),
      row({
        id: 3,
        kind: "deity",
        linkedType: "deity",
        linkedId: 5,
        mapImage: null,
      }),
      row({ id: 4, kind: "region", mapImage: null }), // no map yet, not navigable
      row({ id: 5, kind: "plane" }),
      row({ id: 6, kind: "city" }),
      row({ id: 7, kind: "dungeon" }),
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(result.current).toHaveLength(4));
    expect(result.current.map((c) => c.id)).toEqual([1, 5, 6, 7]);
  });

  it("adds a marker to the map for each navigable child", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() =>
      expect(marker).toHaveBeenCalledWith([10, 20], expect.any(Object))
    );
    expect(markerAddTo).toHaveBeenCalledWith(fakeMap);
  });

  it("calls onDescend with the child when its marker is clicked", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 7, title: "Kang" })]);
    const onDescend = vi.fn();

    renderHook(() => useNavigableChildren(1, onDescend));

    await waitFor(() => expect(clickHandlers.size).toBe(1));
    const handler = [...clickHandlers.values()][0];
    handler?.();

    expect(onDescend).toHaveBeenCalledWith({
      id: 7,
      title: "Kang",
      lat: 10,
      lng: 20,
      mapImage: "kang.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });
  });
});

describe("useNavigableChildren — drag to reposition (TD-71, SPEC-005 §5.B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers.clear();
    dragendHandlers.clear();
    updatePoi.mockResolvedValue({ ok: true });
  });

  it("renders the marker as draggable", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(marker).toHaveBeenCalled());
    const options = marker.mock.calls[0]?.[1] as { draggable?: boolean };
    expect(options.draggable).toBe(true);
  });

  it("sends only id/lat/lng on drop, never category", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useNavigableChildren(1, vi.fn()));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(updatePoi).toHaveBeenCalledWith({ id: 1, lat: 99, lng: 88 })
    );
  });

  it("does not call onDescend for the click Leaflet may fire right after a drag", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);
    const onDescend = vi.fn();

    renderHook(() => useNavigableChildren(1, onDescend));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      clickHandlers.values().next().value?.();
      await Promise.resolve();
    });

    expect(onDescend).not.toHaveBeenCalled();
  });

  it("still descends on a genuine click with no preceding drag", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);
    const onDescend = vi.fn();

    renderHook(() => useNavigableChildren(1, onDescend));
    await waitFor(() => expect(clickHandlers.size).toBe(1));

    clickHandlers.values().next().value?.();

    expect(onDescend).toHaveBeenCalled();
  });

  it("reverts the position and notifies when the server rejects the drag", async () => {
    updatePoi.mockResolvedValue({ ok: false });
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
