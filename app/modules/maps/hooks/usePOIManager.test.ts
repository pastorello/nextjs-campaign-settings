import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import type PlaceChild from "@/app/lib/definitions/interfaces/maps/PlaceChild";

// The Server Actions the hook now persists through. `vi.hoisted` because the
// mock factories below are hoisted above this file's own statements.
const { fetchPlaceChildren, createPoi, updatePoi, deletePoi } = vi.hoisted(
  () => ({
    fetchPlaceChildren: vi.fn(),
    createPoi: vi.fn(),
    updatePoi: vi.fn(),
    deletePoi: vi.fn(),
  })
);

vi.mock("@/app/lib/data/maps/fetchPlaceChildren", () => ({
  default: fetchPlaceChildren,
}));
vi.mock("@/app/lib/data/maps/createPoi", () => ({ default: createPoi }));
vi.mock("@/app/lib/data/maps/updatePoi", () => ({ default: updatePoi }));
vi.mock("@/app/lib/data/maps/deletePoi", () => ({ default: deletePoi }));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess: vi.fn(),
}));

// The hook resolves its failure copy through next-intl; the catalogues are
// TD-21's and covered by `messages/messages.test.ts`. Here only the key
// matters, so the message function echoes it back.
//
// The translator is a single module-level function, not a fresh arrow per
// call: real `useTranslations` memoises its return value, and a mock that
// returned a new identity every render would model something the library
// does not do. (Written the naive way first, it did exactly that — and the
// hook's mount effect re-fired on every render, which is what put the
// `tRef` in `usePOIManager` there.)
const translate = (key: string) => key;
vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));

// Marker/drag tests (TD-71, SPEC-005 §5.B) need a real-enough Leaflet map
// present — every other test in this file leaves it null via `MapProvider`'s
// default, which short-circuits `createMarker`/`renderMarkers` before any of
// this runs. Mocking the hook directly, same as `useNavigableChildren.test.ts`,
// is simpler than driving `MapProvider`'s own `setMap`.
const fakeMap = { hasLayer: vi.fn(() => true), removeLayer: vi.fn() };
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const dragendHandlers = new Map<unknown, () => void>();
const markerGetLatLng = vi.fn(() => ({ lat: 99, lng: 88 }));
const markerAddTo = vi.fn();
const marker = vi.fn((..._args: unknown[]) => {
  const instance = {
    addTo: markerAddTo,
    bindPopup: vi.fn(),
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

import { usePOIManager } from "./usePOIManager";

const storedRow: PlaceChild = {
  id: 7,
  title: "Tavern",
  description: null,
  kind: "poi",
  lat: 10,
  lng: 20,
  category: "food-drink",
  mapImage: null,
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  footprint: null,
  gridColumns: null,
  gridScale: null,
  createdAt: new Date(1),
  updatedAt: new Date(1),
};

const PARENT_ID = 1;

async function renderLoaded() {
  const rendered = renderHook(() => usePOIManager(PARENT_ID), {
    wrapper: MapProvider,
  });
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  return rendered;
}

/**
 * Runs a synchronous interaction inside `act`, then lets the Server Action
 * promises it queued settle. The hook's mutators return immediately — that
 * is the whole point of the optimistic path — so the assertions about what
 * the *write* did need a flush that the interaction itself does not await.
 */
async function settle(interaction: () => void) {
  await act(async () => {
    interaction();
    await Promise.resolve();
  });
}

describe("usePOIManager — loading from the server (TD-14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPlaceChildren.mockResolvedValue([]);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads persisted POIs, keying them by their database id", async () => {
    fetchPlaceChildren.mockResolvedValue([storedRow]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toEqual([
      {
        id: "7",
        title: "Tavern",
        description: undefined,
        lat: 10,
        lng: 20,
        category: "food-drink",
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
  });

  it("discards a row whose category this build does not know", async () => {
    fetchPlaceChildren.mockResolvedValue([
      storedRow,
      { ...storedRow, id: 8, category: "not-a-category" },
    ]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toHaveLength(1);
    expect(console.warn).toHaveBeenCalled();
  });

  it("excludes an unpositioned landmark rather than crashing (SPEC-010 T1)", async () => {
    fetchPlaceChildren.mockResolvedValue([
      storedRow,
      { ...storedRow, id: 9, lat: null, lng: null },
    ]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toEqual([expect.objectContaining({ id: "7" })]);
  });

  it("ignores a sibling that is a region, not a poi", async () => {
    fetchPlaceChildren.mockResolvedValue([
      storedRow,
      {
        ...storedRow,
        id: 9,
        kind: "region",
        lat: null,
        lng: null,
        category: null,
        mapImage: "kang.png",
      },
    ]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toHaveLength(1);
    expect(result.current.pois[0]?.id).toBe("7");
  });

  it("reports a failed load instead of crashing the map", async () => {
    fetchPlaceChildren.mockRejectedValue(new Error("database down"));

    const { result } = await renderLoaded();

    expect(result.current.pois).toEqual([]);
    expect(notifyError).toHaveBeenCalledWith("poiLoadFailed");
  });
});

describe("usePOIManager — optimistic writes (TD-14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPlaceChildren.mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the POI before the write resolves", async () => {
    // A create that never settles: if the marker only appeared afterwards,
    // this POI would never show up at all.
    createPoi.mockReturnValue(new Promise(() => {}));

    const { result } = await renderLoaded();

    act(() => {
      result.current.addPOI("Tavern", 10, 20, "food-drink");
    });

    expect(result.current.pois).toHaveLength(1);
    expect(result.current.pois[0]?.title).toBe("Tavern");
  });

  it("keeps the POI once the write succeeds", async () => {
    createPoi.mockResolvedValue({ ok: true, id: 42 });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.addPOI("Tavern", 10, 20, "food-drink");
    });

    expect(result.current.pois).toHaveLength(1);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("attaches a new POI to the place currently being viewed", async () => {
    createPoi.mockResolvedValue({ ok: true, id: 42 });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.addPOI("Tavern", 10, 20, "food-drink");
    });

    expect(createPoi).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId: PARENT_ID })
    );
  });

  it("rolls the POI back and reports when the write is rejected", async () => {
    createPoi.mockResolvedValue({
      ok: false,
      errors: { title: ["Too short"] },
    });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.addPOI("Tavern", 10, 20, "food-drink");
    });

    expect(result.current.pois).toEqual([]);
    expect(notifyError).toHaveBeenCalledWith("poiSaveFailed");
  });

  it("rolls the POI back when the write throws", async () => {
    createPoi.mockRejectedValue(new Error("network down"));

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.addPOI("Tavern", 10, 20, "food-drink");
    });

    expect(result.current.pois).toEqual([]);
    expect(notifyError).toHaveBeenCalledWith("poiSaveFailed");
  });

  it("settles two rapid adds into two POIs with distinct ids", async () => {
    createPoi
      .mockResolvedValueOnce({ ok: true, id: 1 })
      .mockResolvedValueOnce({ ok: true, id: 2 });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.addPOI("First", 1, 1, "food-drink");
      result.current.addPOI("Second", 2, 2, "lodging");
    });

    expect(result.current.pois).toHaveLength(2);
    expect(result.current.pois.map((poi) => poi.title)).toEqual([
      "First",
      "Second",
    ]);

    const ids = result.current.pois.map((poi) => poi.id);
    expect(new Set(ids).size).toBe(2);
    expect(createPoi).toHaveBeenCalledTimes(2);
  });

  it("deletes a POI created in the same session using its real id", async () => {
    createPoi.mockResolvedValue({ ok: true, id: 42 });
    deletePoi.mockResolvedValue(undefined);

    const { result } = await renderLoaded();

    let createdId = "";
    await settle(() => {
      createdId = result.current.addPOI("Tavern", 10, 20, "food-drink").id;
    });

    await settle(() => {
      result.current.deletePOI(createdId);
    });

    expect(result.current.pois).toEqual([]);
    expect(deletePoi).toHaveBeenCalledWith(42);
  });

  it("deletes a POI queued behind a still-pending create", async () => {
    // The create resolves only after the delete has been issued — the case
    // that has no server id at the moment the user asks for the deletion.
    let resolveCreate: (value: { ok: true; id: number }) => void = () => {};
    createPoi.mockReturnValue(
      new Promise<{ ok: true; id: number }>((resolve) => {
        resolveCreate = resolve;
      })
    );
    deletePoi.mockResolvedValue(undefined);

    const { result } = await renderLoaded();

    let createdId = "";
    act(() => {
      createdId = result.current.addPOI("Tavern", 10, 20, "food-drink").id;
    });

    act(() => {
      result.current.deletePOI(createdId);
    });

    // Nothing deleted yet: the create has not produced an id.
    expect(deletePoi).not.toHaveBeenCalled();

    await settle(() => {
      resolveCreate({ ok: true, id: 99 });
    });

    await waitFor(() => expect(deletePoi).toHaveBeenCalledWith(99));
    expect(result.current.pois).toEqual([]);
  });

  it("restores a deleted POI when the delete fails", async () => {
    fetchPlaceChildren.mockResolvedValue([storedRow]);
    deletePoi.mockRejectedValue(new Error("database down"));

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.deletePOI("7");
    });

    expect(result.current.pois).toHaveLength(1);
    expect(notifyError).toHaveBeenCalledWith("poiDeleteFailed");
  });

  it("reverts an edit the server rejects", async () => {
    fetchPlaceChildren.mockResolvedValue([storedRow]);
    updatePoi.mockResolvedValue({
      ok: false,
      errors: { title: ["Too short"] },
    });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.updatePOI("7", { title: "Renamed" });
    });

    expect(result.current.pois[0]?.title).toBe("Tavern");
    expect(notifyError).toHaveBeenCalledWith("poiSaveFailed");
  });

  it("keeps an edit the server accepts", async () => {
    fetchPlaceChildren.mockResolvedValue([storedRow]);
    updatePoi.mockResolvedValue({ ok: true });

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.updatePOI("7", { title: "Renamed" });
    });

    expect(result.current.pois[0]?.title).toBe("Renamed");
    expect(updatePoi).toHaveBeenCalledWith({ id: 7, title: "Renamed" });
    expect(notifyError).not.toHaveBeenCalled();
  });
});

describe("usePOIManager — marker drag (TD-71, SPEC-005 §5.B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dragendHandlers.clear();
    fetchPlaceChildren.mockResolvedValue([storedRow]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the marker as draggable", async () => {
    await renderLoaded();

    await waitFor(() => expect(marker).toHaveBeenCalled());
    const options = marker.mock.calls[0]?.[1] as { draggable?: boolean };
    expect(options.draggable).toBe(true);
  });

  it("repositions the POI when the marker's dragend fires", async () => {
    updatePoi.mockResolvedValue({ ok: true });
    const { result } = await renderLoaded();
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await settle(() => {
      dragendHandlers.values().next().value?.();
    });

    expect(result.current.pois[0]).toMatchObject({ lat: 99, lng: 88 });
    expect(updatePoi).toHaveBeenCalledWith({ id: 7, lat: 99, lng: 88 });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("reverts and notifies when the server rejects the drag", async () => {
    updatePoi.mockResolvedValue({ ok: false });
    const { result } = await renderLoaded();
    await waitFor(() => expect(dragendHandlers.size).toBe(1));

    await settle(() => {
      dragendHandlers.values().next().value?.();
    });

    expect(result.current.pois[0]).toMatchObject({
      lat: storedRow.lat,
      lng: storedRow.lng,
    });
    expect(notifyError).toHaveBeenCalledWith("poiSaveFailed");
  });
});
