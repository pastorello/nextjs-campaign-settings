import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPlaceChildren } = vi.hoisted(() => ({
  fetchPlaceChildren: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchPlaceChildren", () => ({
  default: fetchPlaceChildren,
}));

const fakeMap = {
  hasLayer: vi.fn(() => true),
  removeLayer: vi.fn(),
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const clickHandlers = new Map<unknown, () => void>();
const markerAddTo = vi.fn();
const markerBindTooltip = vi.fn();
const marker = vi.fn(() => {
  const instance = {
    addTo: markerAddTo,
    bindTooltip: markerBindTooltip,
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "click") clickHandlers.set(instance, handler);
    }),
  };
  markerAddTo.mockReturnValue(instance);
  return instance;
});
vi.mock("leaflet", () => ({
  marker: (...args: unknown[]) => marker(...(args as [])),
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

  it("exposes only navigable region children — not poi, deity or npc kinds", async () => {
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
    ]);

    const { result } = renderHook(() => useNavigableChildren(1, vi.fn()));

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]?.id).toBe(1);
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
