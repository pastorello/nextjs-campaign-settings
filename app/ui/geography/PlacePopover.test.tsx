import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

type MapHandler = () => void;

const mapHandlers: Record<string, MapHandler> = {};
const mapOn = vi.fn((event: string, handler: MapHandler) => {
  mapHandlers[event] = handler;
});
const mapOff = vi.fn();
const latLngToContainerPoint = vi.fn(([lat, lng]: [number, number]) => ({
  x: lat * 2,
  y: lng * 3,
}));
// A single stable object, not a fresh one per call — the real
// `useLeafletMap` returns the same context value across renders unless the
// underlying map instance itself changes. Returning a new object identity
// on every call here made `map` a changing effect dependency, which
// re-triggered the position effect every render and spun forever.
const fakeMap = { latLngToContainerPoint, on: mapOn, off: mapOff };
const useLeafletMap = vi.fn(() => fakeMap);
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => useLeafletMap(),
}));

import PlacePopover from "./PlacePopover";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";

const place: NavigableChild = {
  id: 7,
  title: "Taverna del Gallo Robin",
  description: "A cozy tavern by the docks.",
  lat: 10,
  lng: 20,
  mapImage: "tavern.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  footprint: null,
  gridColumns: null,
  gridScale: null,
};

const onClose = vi.fn();
const onOpenMap = vi.fn();

function renderPopover(overrides: Partial<NavigableChild> = {}) {
  return render(
    <PlacePopover
      place={{ ...place, ...overrides }}
      onClose={onClose}
      onOpenMap={onOpenMap}
    />
  );
}

// The outside-click listener attaches after a 0ms timeout (to avoid closing
// from the same Leaflet click that opened the popover) — let it run.
async function flushOutsideClickTimeout() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

beforeEach(() => {
  vi.clearAllMocks();
  delete mapHandlers["move"];
  delete mapHandlers["zoom"];
  latLngToContainerPoint.mockImplementation(([lat, lng]: [number, number]) => ({
    x: lat * 2,
    y: lng * 3,
  }));
  useLeafletMap.mockReturnValue(fakeMap);
});

describe("PlacePopover", () => {
  it("renders nothing until the map instance is available", () => {
    useLeafletMap.mockReturnValue(null as never);

    renderPopover();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("positions itself at the clicked place's lat/lng, converted to a container point", () => {
    renderPopover();

    expect(latLngToContainerPoint).toHaveBeenCalledWith([10, 20]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveStyle({ left: "20px", top: "60px" });
  });

  it("shows the place's title and description", () => {
    renderPopover();

    expect(screen.getByText("Taverna del Gallo Robin")).toBeInTheDocument();
    expect(screen.getByText("A cozy tavern by the docks.")).toBeInTheDocument();
  });

  it("omits the description block when the place has none", () => {
    renderPopover({ description: null });

    expect(
      screen.queryByText("A cozy tavern by the docks.")
    ).not.toBeInTheDocument();
  });

  it("calls onOpenMap with the place when Apri mappa is clicked and the place has a map", () => {
    renderPopover();

    fireEvent.click(screen.getByText("openMap"));

    expect(onOpenMap).toHaveBeenCalledWith(place);
  });

  it("disables Apri mappa with an explanatory label when the place has no map yet", () => {
    renderPopover({ mapImage: null });

    const button = screen.getByText("openMap");
    expect(button).toBeDisabled();
    expect(screen.getByText("openMapUnavailable")).toBeInTheDocument();

    fireEvent.click(button);
    expect(onOpenMap).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    renderPopover();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", () => {
    renderPopover();

    fireEvent.click(screen.getByLabelText("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on outside click but not on a click inside the popover", async () => {
    renderPopover();
    await flushOutsideClickTimeout();

    fireEvent.mouseDown(screen.getByText("Taverna del Gallo Robin"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("recomputes its position when the map pans or zooms", () => {
    renderPopover();
    latLngToContainerPoint.mockClear();
    latLngToContainerPoint.mockReturnValue({ x: 99, y: 88 });

    act(() => {
      mapHandlers["move"]?.();
    });

    expect(latLngToContainerPoint).toHaveBeenCalledWith([10, 20]);
    expect(screen.getByRole("dialog")).toHaveStyle({
      left: "99px",
      top: "88px",
    });
  });

  it("tears down its map listeners on unmount", () => {
    const { unmount } = renderPopover();

    unmount();

    expect(mapOff).toHaveBeenCalledWith("move", expect.any(Function));
    expect(mapOff).toHaveBeenCalledWith("zoom", expect.any(Function));
  });
});
