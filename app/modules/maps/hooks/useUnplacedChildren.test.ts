import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPlaceChildren } = vi.hoisted(() => ({
  fetchPlaceChildren: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchPlaceChildren", () => ({
  default: fetchPlaceChildren,
}));

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    title: "Kingdom of Kang",
    description: null,
    kind: "region",
    lat: null,
    lng: null,
    category: null,
    mapImage: null,
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

import { useUnplacedChildren } from "./useUnplacedChildren";

describe("useUnplacedChildren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("fetches this place's children scoped by parentId", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    renderHook(() => useUnplacedChildren(42));

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledWith(42));
  });

  it("refetches when refetchToken changes, e.g. after positioning a place", async () => {
    fetchPlaceChildren.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ token }: { token: number }) => useUnplacedChildren(42, token),
      { initialProps: { token: 0 } }
    );
    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(1));

    rerender({ token: 1 });

    await waitFor(() => expect(fetchPlaceChildren).toHaveBeenCalledTimes(2));
  });

  it("keeps only children missing lat or lng — a landmark poi never is (SPEC-008 T8)", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region", lat: null, lng: null }),
      row({ id: 2, kind: "poi", category: "religion", lat: 1, lng: 2 }),
      row({ id: 3, kind: "city", lat: null, lng: null }),
    ]);

    const { result } = renderHook(() => useUnplacedChildren(42));

    await waitFor(() =>
      expect(result.current.map((child) => child.id)).toEqual([1, 3])
    );
  });

  it("discards a row with an unrecognized kind and warns", async () => {
    fetchPlaceChildren.mockResolvedValue([
      row({ id: 1, kind: "region", lat: null }),
      row({ id: 2, kind: "some-future-kind", lat: null }),
    ]);

    const { result } = renderHook(() => useUnplacedChildren(42));

    await waitFor(() =>
      expect(result.current.map((child) => child.id)).toEqual([1])
    );
    expect(console.warn).toHaveBeenCalledWith(
      "Discarding place with an unknown kind:",
      2
    );
  });

  it("logs and leaves the list empty when the fetch fails", async () => {
    fetchPlaceChildren.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useUnplacedChildren(42));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });
});
