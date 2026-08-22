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

// The list is unit-tested in its own file; here it stands in for itself, so
// this suite stays a test of the popover shell rather than of the entity
// fetch behind it.
const entityListProps = vi.fn();
vi.mock("@/app/ui/geography/PlaceEntityList", () => ({
  default: ({
    target,
    refreshKey,
  }: {
    target: unknown;
    refreshKey?: number;
  }) => {
    entityListProps(target, refreshKey);
    return <div data-testid="entity-list" />;
  },
}));

// Same reasoning: the picker/modal flow itself is `AttachEntityButton`'s own
// suite; here it stands in so this suite only exercises how the popover
// wires it (T4, extended with `poiId` in T7).
const attachEntityProps = vi.fn();
vi.mock("@/app/ui/geography/AttachEntityButton", () => ({
  default: ({
    zoneId,
    poiId,
    isOpen,
    onAttached,
  }: {
    zoneId: number;
    poiId?: number | null;
    isOpen: boolean;
    onClose: () => void;
    onAttached?: () => void;
  }) => {
    attachEntityProps({ zoneId, poiId: poiId ?? null, isOpen });
    return isOpen ? (
      <button onClick={() => onAttached?.()}>simulate-attach</button>
    ) : null;
  },
}));

// Same reasoning again: the confirmation dialog and the SPEC-010 mutation
// are `DeletePlaceButton`'s own suite; here it stands in so this suite only
// exercises how the popover wires it (T6).
const deletePlaceProps = vi.fn();
vi.mock("@/app/ui/geography/DeletePlaceButton", () => ({
  default: ({
    placeId,
    placeTitle,
    parentTitle,
    isRoot,
    isOpen,
    onDeleted,
  }: {
    placeId: number;
    placeTitle: string;
    parentTitle: string;
    isRoot: boolean;
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
  }) => {
    deletePlaceProps({ placeId, placeTitle, parentTitle, isRoot, isOpen });
    return isOpen ? (
      <button onClick={() => onDeleted()}>simulate-delete</button>
    ) : null;
  },
}));

import PlacePopover, { type PopoverTarget } from "./PlacePopover";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type { POI } from "@/app/modules/maps/types/poi";

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

const poi: POI = {
  id: "42",
  title: "Fontana del Corvo",
  description: "A weathered stone fountain.",
  lat: 12,
  lng: 24,
  category: "tourism",
  createdAt: 0,
  updatedAt: 0,
};

const onClose = vi.fn();
const onOpenMap = vi.fn();
const onUnplace = vi.fn();
const onDeleted = vi.fn();
const onEditLandmark = vi.fn();
const onDeleteLandmark = vi.fn();
const parentId = 3;
const parentTitle = "Kang";

function renderPopover(
  target: PopoverTarget = { kind: "zone", place },
  overrideParentId: number = parentId
) {
  return render(
    <PlacePopover
      target={target}
      parentId={overrideParentId}
      parentTitle={parentTitle}
      onClose={onClose}
      onOpenMap={onOpenMap}
      onUnplace={onUnplace}
      onDeleted={onDeleted}
      onEditLandmark={onEditLandmark}
      onDeleteLandmark={onDeleteLandmark}
    />
  );
}

function renderZonePopover(overrides: Partial<NavigableChild> = {}) {
  return renderPopover({ kind: "zone", place: { ...place, ...overrides } });
}

function renderLandmarkPopover(overrides: Partial<POI> = {}) {
  return renderPopover({ kind: "poi", poi: { ...poi, ...overrides } });
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

describe("PlacePopover — zone", () => {
  it("renders nothing until the map instance is available", () => {
    useLeafletMap.mockReturnValue(null as never);

    renderZonePopover();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("positions itself at the clicked place's lat/lng, converted to a container point", () => {
    renderZonePopover();

    expect(latLngToContainerPoint).toHaveBeenCalledWith([10, 20]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveStyle({ left: "20px", top: "60px" });
  });

  it("shows the place's title and description", () => {
    renderZonePopover();

    expect(screen.getByText("Taverna del Gallo Robin")).toBeInTheDocument();
    expect(screen.getByText("A cozy tavern by the docks.")).toBeInTheDocument();
  });

  it("omits the description block when the place has none", () => {
    renderZonePopover({ description: null });

    expect(
      screen.queryByText("A cozy tavern by the docks.")
    ).not.toBeInTheDocument();
  });

  it("calls onOpenMap with the place when Apri mappa is clicked and the place has a map", () => {
    renderZonePopover();

    fireEvent.click(screen.getByText("openMap"));

    expect(onOpenMap).toHaveBeenCalledWith(place);
  });

  it("disables Apri mappa with an explanatory label when the place has no map yet", () => {
    renderZonePopover({ mapImage: null });

    const button = screen.getByText("openMap");
    expect(button).toBeDisabled();
    expect(screen.getByText("openMapUnavailable")).toBeInTheDocument();

    fireEvent.click(button);
    expect(onOpenMap).not.toHaveBeenCalled();
  });

  it("lists the entities present at the clicked zone", () => {
    renderZonePopover();

    expect(screen.getByTestId("entity-list")).toBeInTheDocument();
    expect(entityListProps).toHaveBeenCalledWith({ zoneId: 7 }, 0);
  });

  it("keeps the attach control closed until Collega personaggio is clicked, pre-filled with the zone and no landmark", () => {
    renderZonePopover();

    expect(attachEntityProps).toHaveBeenCalledWith({
      zoneId: 7,
      poiId: null,
      isOpen: false,
    });
    expect(screen.queryByText("simulate-attach")).not.toBeInTheDocument();
  });

  it("opens the attach control pre-filled with the clicked zone", () => {
    renderZonePopover();

    fireEvent.click(screen.getByText("attach"));

    expect(attachEntityProps).toHaveBeenLastCalledWith({
      zoneId: 7,
      poiId: null,
      isOpen: true,
    });
  });

  it("refreshes the entities list once an attach completes, without reopening the popover", () => {
    renderZonePopover();
    fireEvent.click(screen.getByText("attach"));
    entityListProps.mockClear();

    fireEvent.click(screen.getByText("simulate-attach"));

    expect(entityListProps).toHaveBeenCalledWith({ zoneId: 7 }, 1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onUnplace with the clicked place when Sposta nei luoghi non posizionati is clicked, without asking for confirmation", () => {
    renderZonePopover();

    fireEvent.click(screen.getByText("unplace"));

    expect(onUnplace).toHaveBeenCalledWith(place);
    expect(onUnplace).toHaveBeenCalledTimes(1);
  });

  it("keeps the delete confirmation closed until Rimuovi definitivamente is clicked", () => {
    renderZonePopover();

    expect(deletePlaceProps).toHaveBeenCalledWith({
      placeId: 7,
      placeTitle: place.title,
      parentTitle,
      isRoot: false,
      isOpen: false,
    });
    expect(screen.queryByText("simulate-delete")).not.toBeInTheDocument();
  });

  it("opens the delete confirmation, pre-filled with the clicked place and its parent, when Rimuovi definitivamente is clicked", () => {
    renderZonePopover();

    fireEvent.click(screen.getByText("delete"));

    expect(deletePlaceProps).toHaveBeenLastCalledWith({
      placeId: 7,
      placeTitle: place.title,
      parentTitle,
      isRoot: false,
      isOpen: true,
    });
  });

  it("calls onDeleted once the deletion confirms, without calling onUnplace or onClose itself", () => {
    renderZonePopover();
    fireEvent.click(screen.getByText("delete"));

    fireEvent.click(screen.getByText("simulate-delete"));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onUnplace).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders no landmark-only action", () => {
    renderZonePopover();

    expect(screen.queryByText("editLandmark")).not.toBeInTheDocument();
    expect(screen.queryByText("deleteLandmark")).not.toBeInTheDocument();
  });

  it("does not close on a click inside a Headless UI portal (the attach modal escapes popoverRef)", async () => {
    renderZonePopover();
    await flushOutsideClickTimeout();

    const portalNode = document.createElement("div");
    portalNode.setAttribute("data-headlessui-portal", "");
    document.body.appendChild(portalNode);

    fireEvent.mouseDown(portalNode);

    expect(onClose).not.toHaveBeenCalled();
    document.body.removeChild(portalNode);
  });

  it("closes on Escape", () => {
    renderZonePopover();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", () => {
    renderZonePopover();

    fireEvent.click(screen.getByLabelText("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on outside click but not on a click inside the popover", async () => {
    renderZonePopover();
    await flushOutsideClickTimeout();

    fireEvent.mouseDown(screen.getByText("Taverna del Gallo Robin"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("recomputes its position when the map pans or zooms", () => {
    renderZonePopover();
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
    const { unmount } = renderZonePopover();

    unmount();

    expect(mapOff).toHaveBeenCalledWith("move", expect.any(Function));
    expect(mapOff).toHaveBeenCalledWith("zoom", expect.any(Function));
  });
});

describe("PlacePopover — landmark (SPEC-016 T7)", () => {
  it("positions itself at the clicked landmark's lat/lng", () => {
    renderLandmarkPopover();

    expect(latLngToContainerPoint).toHaveBeenCalledWith([12, 24]);
  });

  it("shows the landmark's title and description", () => {
    renderLandmarkPopover();

    expect(screen.getByText("Fontana del Corvo")).toBeInTheDocument();
    expect(screen.getByText("A weathered stone fountain.")).toBeInTheDocument();
  });

  it("omits the description block when the landmark has none", () => {
    renderLandmarkPopover({ description: undefined });

    expect(
      screen.queryByText("A weathered stone fountain.")
    ).not.toBeInTheDocument();
  });

  it("lists the entities present at the clicked landmark, keyed by poiId", () => {
    renderLandmarkPopover();

    expect(entityListProps).toHaveBeenCalledWith({ poiId: 42 }, 0);
  });

  it("pre-fills the attach control with the enclosing zone and the landmark itself", () => {
    renderLandmarkPopover();

    fireEvent.click(screen.getByText("attach"));

    expect(attachEntityProps).toHaveBeenLastCalledWith({
      zoneId: parentId,
      poiId: 42,
      isOpen: true,
    });
  });

  it("renders no zone-only action", () => {
    renderLandmarkPopover();

    expect(screen.queryByText("openMap")).not.toBeInTheDocument();
    expect(screen.queryByText("unplace")).not.toBeInTheDocument();
    expect(screen.queryByText("delete")).not.toBeInTheDocument();
  });

  it("calls onEditLandmark with the clicked landmark when Modifica is clicked", () => {
    const currentPoi = { ...poi };
    renderPopover({ kind: "poi", poi: currentPoi });

    fireEvent.click(screen.getByText("editLandmark"));

    expect(onEditLandmark).toHaveBeenCalledWith(currentPoi);
    expect(onEditLandmark).toHaveBeenCalledTimes(1);
  });

  it("calls onDeleteLandmark with the clicked landmark when Elimina is clicked, without asking for confirmation", () => {
    const currentPoi = { ...poi };
    renderPopover({ kind: "poi", poi: currentPoi });

    fireEvent.click(screen.getByText("deleteLandmark"));

    expect(onDeleteLandmark).toHaveBeenCalledWith(currentPoi);
    expect(onDeleteLandmark).toHaveBeenCalledTimes(1);
    // No `DeletePlaceButton` (the zone's confirmed SPEC-010 flow, T6) is
    // even mounted for a landmark — `deletePlaceProps` is the mock's own
    // call log, so an empty one proves the component was never rendered.
    expect(deletePlaceProps).not.toHaveBeenCalled();
  });
});
