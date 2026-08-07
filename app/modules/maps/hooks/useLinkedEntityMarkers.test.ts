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

// `next-intl` is already mocked globally in vitest.setup.ts (echoes the key
// back), which is enough for this hook's one `t()` call.

const fakeMap = {
  hasLayer: vi.fn(() => true),
  removeLayer: vi.fn(),
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const bindPopup = vi.fn();
const markerAddTo = vi.fn();
const markerGetLatLng = vi.fn(() => ({ lat: 99, lng: 88 }));
const dragendHandlers = new Map<unknown, () => void>();
const marker = vi.fn((..._args: unknown[]) => {
  const instance = {
    addTo: markerAddTo,
    bindPopup,
    getLatLng: markerGetLatLng,
    on: vi.fn((event: string, handler: () => void) => {
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
    title: "Elune",
    description: null,
    kind: "deity",
    lat: 10,
    lng: 20,
    category: null,
    linkedType: "deity",
    linkedId: 18,
    mapImage: null,
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

import { useLinkedEntityMarkers } from "./useLinkedEntityMarkers";

describe("useLinkedEntityMarkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dragendHandlers.clear();
    updatePoi.mockResolvedValue({ ok: true });
  });

  it("fetches this place's children scoped by parentId", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    renderHook(() => useLinkedEntityMarkers(42));

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledWith(42));
  });

  it("refetches when refetchToken changes", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ token }: { token: number }) => useLinkedEntityMarkers(42, token),
      { initialProps: { token: 0 } }
    );
    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(1));

    rerender({ token: 1 });

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(2));
  });

  it("exposes only positioned, linked deity and npc children", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "deity" }),
      row({ id: 2, kind: "npc", linkedType: "npc", linkedId: 7 }),
      row({ id: 3, kind: "region" }),
      row({ id: 4, kind: "poi", category: "religion" }),
      row({ id: 5, kind: "deity", lat: null, lng: null }), // not positioned
      row({ id: 6, kind: "deity", linkedType: null, linkedId: null }), // orphaned link
    ]);

    const { result } = renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.map((c) => c.id)).toEqual([1, 2]);
  });

  it("adds a marker to the map for each linked child", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() =>
      expect(marker).toHaveBeenCalledWith([10, 20], expect.any(Object))
    );
    expect(markerAddTo).toHaveBeenCalledWith(fakeMap);
  });

  it("binds a popup linking to the entity's page", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, title: "Elune", linkedType: "deity", linkedId: 18 }),
    ]);

    renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() => expect(bindPopup).toHaveBeenCalledTimes(1));
    const popupHtml = bindPopup.mock.calls[0]?.[0] as string;
    expect(popupHtml).toContain("Elune");
    expect(popupHtml).toContain("/dashboard/deities?id=18");
  });

  it("escapes a title containing HTML before it reaches the popup", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, title: '<img src=x onerror="alert(1)">' }),
    ]);

    renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() => expect(bindPopup).toHaveBeenCalledTimes(1));
    const popupHtml = bindPopup.mock.calls[0]?.[0] as string;
    expect(popupHtml).not.toContain("<img");
    expect(popupHtml).toContain("&lt;img");
  });

  it("removes markers on unmount", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    const { unmount } = renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() => expect(markerAddTo).toHaveBeenCalled());
    unmount();

    expect(fakeMap.removeLayer).toHaveBeenCalled();
  });
});

describe("useLinkedEntityMarkers — drag to reposition (TD-71, SPEC-005 §5.B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dragendHandlers.clear();
    updatePoi.mockResolvedValue({ ok: true });
  });

  it("renders the marker as draggable", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useLinkedEntityMarkers(1));

    await waitFor(() => expect(marker).toHaveBeenCalled());
    const options = marker.mock.calls[0]?.[1] as { draggable?: boolean };
    expect(options.draggable).toBe(true);
  });

  it("sends only id/lat/lng on drop, never category", async () => {
    fetchPlaceChildren.mockResolvedValue([row({ id: 1 })]);

    renderHook(() => useLinkedEntityMarkers(1));
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await act(async () => {
      dragendHandlers.values().next().value?.();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(updatePoi).toHaveBeenCalledWith({ id: 1, lat: 99, lng: 88 })
    );
  });

  it("reverts the position and notifies when the server rejects the drag", async () => {
    updatePoi.mockResolvedValue({ ok: false });
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, title: "Elune", lat: 10, lng: 20 }),
    ]);

    const { result } = renderHook(() => useLinkedEntityMarkers(1));
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
