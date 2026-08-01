import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import type Poi from "@/app/lib/definitions/interfaces/maps/Poi";

// The Server Actions the hook now persists through. `vi.hoisted` because the
// mock factories below are hoisted above this file's own statements.
const { fetchPois, createPoi, updatePoi, deletePoi } = vi.hoisted(() => ({
  fetchPois: vi.fn(),
  createPoi: vi.fn(),
  updatePoi: vi.fn(),
  deletePoi: vi.fn(),
}));

vi.mock("@/app/lib/data/maps/fetchPois", () => ({ default: fetchPois }));
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

import { usePOIManager } from "./usePOIManager";

const storedRow: Poi = {
  id: 7,
  title: "Tavern",
  description: null,
  lat: 10,
  lng: 20,
  category: "food-drink",
  linkedType: null,
  linkedId: null,
  createdAt: new Date(1),
  updatedAt: new Date(1),
};

async function renderLoaded() {
  const rendered = renderHook(() => usePOIManager(), { wrapper: MapProvider });
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
    fetchPois.mockResolvedValue([]);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads persisted POIs, keying them by their database id", async () => {
    fetchPois.mockResolvedValue([storedRow]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toEqual([
      {
        id: "7",
        title: "Tavern",
        description: undefined,
        lat: 10,
        lng: 20,
        category: "food-drink",
        linkedType: null,
        linkedId: null,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
  });

  it("carries a POI's link through to the client shape", async () => {
    fetchPois.mockResolvedValue([
      { ...storedRow, linkedType: "deity", linkedId: 3 },
    ]);

    const { result } = await renderLoaded();

    expect(result.current.pois[0]?.linkedType).toBe("deity");
    expect(result.current.pois[0]?.linkedId).toBe(3);
  });

  it("discards a row whose category this build does not know", async () => {
    fetchPois.mockResolvedValue([
      storedRow,
      { ...storedRow, id: 8, category: "not-a-category" },
    ]);

    const { result } = await renderLoaded();

    expect(result.current.pois).toHaveLength(1);
    expect(console.warn).toHaveBeenCalled();
  });

  it("reports a failed load instead of crashing the map", async () => {
    fetchPois.mockRejectedValue(new Error("database down"));

    const { result } = await renderLoaded();

    expect(result.current.pois).toEqual([]);
    expect(notifyError).toHaveBeenCalledWith("poiLoadFailed");
  });
});

describe("usePOIManager — optimistic writes (TD-14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPois.mockResolvedValue([]);
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
    fetchPois.mockResolvedValue([storedRow]);
    deletePoi.mockRejectedValue(new Error("database down"));

    const { result } = await renderLoaded();

    await settle(() => {
      result.current.deletePOI("7");
    });

    expect(result.current.pois).toHaveLength(1);
    expect(notifyError).toHaveBeenCalledWith("poiDeleteFailed");
  });

  it("reverts an edit the server rejects", async () => {
    fetchPois.mockResolvedValue([storedRow]);
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
    fetchPois.mockResolvedValue([storedRow]);
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
