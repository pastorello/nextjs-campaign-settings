import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { useUnplacedPlaces, placeZone, placeLandmark } = vi.hoisted(() => ({
  useUnplacedPlaces: vi.fn(),
  placeZone: vi.fn(),
  placeLandmark: vi.fn(),
}));
vi.mock("@/app/modules/maps/hooks/useUnplacedPlaces", () => ({
  useUnplacedPlaces,
}));
vi.mock("@/app/lib/data/maps/placeZone", () => ({ default: placeZone }));
vi.mock("@/app/lib/data/maps/placeLandmark", () => ({
  default: placeLandmark,
}));

import { usePlacePositioning } from "./usePlacePositioning";

// `WorldMap.test.tsx` covers every placement outcome through the component
// (TD-85, TD-93, TD-102, SPEC-017); these pin down the hook's own seams.

const pool = [
  { id: 2, title: "Here", kind: "city", parentId: 1, parentTitle: "Terra" },
  { id: 3, title: "Far", kind: "region", parentId: 9, parentTitle: "Kang" },
  // An ancestor of the map in view — never offered (T5).
  { id: 7, title: "Ancestor", kind: "region", parentId: 9, parentTitle: "X" },
  // A landmark sharing that id — still offered (TD-102).
  { id: 7, title: "Landmark", kind: "poi", parentId: 1, parentTitle: "Terra" },
];

function render() {
  const onPlacesChanged = vi.fn();
  const reloadPOIs = vi.fn(() => Promise.resolve());
  const hook = renderHook(() =>
    usePlacePositioning({
      parentId: 1,
      ancestorIds: [7, 1],
      refetchToken: 4,
      onPlacesChanged,
      reloadPOIs,
    })
  );
  return { result: hook.result, onPlacesChanged, reloadPOIs };
}

describe("usePlacePositioning (TD-127)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    useUnplacedPlaces.mockReturnValue(pool);
    placeZone.mockResolvedValue({ ok: true });
    placeLandmark.mockResolvedValue({ ok: true });
  });

  it("reads the pool with the places token and the map in view", () => {
    render();
    expect(useUnplacedPlaces).toHaveBeenCalledWith(4, 1);
  });

  it("splits the pool into this map's places and the rest, leaving out ancestors", () => {
    const { result } = render();

    expect(result.current.picker.here).toEqual([
      { key: "zone:2", title: "Here" },
      { key: "poi:7", title: "Landmark" },
    ]);
    expect(result.current.picker.elsewhere).toEqual([
      {
        key: "zone:3",
        title: "Far",
        sublabel: "positionPlace.fromParent",
      },
    ]);
    expect(result.current.picker.byKey.has("zone:7")).toBe(false);
  });

  it("places a zone under this map and bumps the places token", async () => {
    const { result, onPlacesChanged, reloadPOIs } = render();

    await act(() => result.current.positionPlace("zone:3", 10, 20));

    expect(placeZone).toHaveBeenCalledWith({
      id: 3,
      parentId: 1,
      lat: 10,
      lng: 20,
    });
    expect(onPlacesChanged).toHaveBeenCalledTimes(1);
    expect(reloadPOIs).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("positionPlace.movedToast");
  });

  it("places a landmark and reloads the landmark markers", async () => {
    const { result, reloadPOIs } = render();

    await act(() => result.current.positionPlace("poi:7", 10, 20));

    expect(placeLandmark).toHaveBeenCalledWith({
      id: 7,
      zoneId: 1,
      lat: 10,
      lng: 20,
    });
    expect(reloadPOIs).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("positionPlace.placedToast");
  });

  it("refuses a key the pool does not hold rather than guessing a table", async () => {
    const { result, onPlacesChanged } = render();

    await act(() => result.current.positionPlace("zone:99", 10, 20));

    expect(placeZone).not.toHaveBeenCalled();
    expect(placeLandmark).not.toHaveBeenCalled();
    expect(onPlacesChanged).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("placePositionFailed");
  });

  it("names a refused placement by its reason", async () => {
    placeZone.mockResolvedValue({ ok: false, code: "wouldCycle" });
    const { result, onPlacesChanged } = render();

    await act(() => result.current.positionPlace("zone:2", 10, 20));

    expect(onPlacesChanged).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("placeContainsThisMap");
  });
});
