import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MapContextMenu } from "./MapContextMenu";
import type { ContextMenuPosition } from "@/app/modules/maps/hooks/useMapContextMenu";

const position: ContextMenuPosition = {
  x: 10,
  y: 20,
  latlng: { lat: 12.3456, lng: 65.4321 },
};

function renderMenu(
  overrides: Partial<Parameters<typeof MapContextMenu>[0]> = {}
) {
  const onClose = vi.fn();
  const onAddMarker = vi.fn();
  const onStartMeasurement = vi.fn();
  const onAddPOI = vi.fn();

  const utils = render(
    <MapContextMenu
      isOpen
      position={position}
      onClose={onClose}
      onAddMarker={onAddMarker}
      onStartMeasurement={onStartMeasurement}
      onAddPOI={onAddPOI}
      {...overrides}
    />
  );

  return { ...utils, onClose, onAddMarker, onStartMeasurement, onAddPOI };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MapContextMenu", () => {
  it("renders nothing when closed or without a position", () => {
    const { container } = render(
      <MapContextMenu
        isOpen={false}
        position={position}
        onClose={vi.fn()}
        onAddMarker={vi.fn()}
        onStartMeasurement={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();

    const { container: container2 } = render(
      <MapContextMenu
        isOpen
        position={null}
        onClose={vi.fn()}
        onAddMarker={vi.fn()}
        onStartMeasurement={vi.fn()}
      />
    );
    expect(container2).toBeEmptyDOMElement();
  });

  it("shows Add Marker and Measure, but not Add Place without onAddPOI", () => {
    render(
      <MapContextMenu
        isOpen
        position={position}
        onClose={vi.fn()}
        onAddMarker={vi.fn()}
        onStartMeasurement={vi.fn()}
      />
    );

    expect(screen.getByText("Add Marker")).toBeInTheDocument();
    expect(screen.getByText("Measure")).toBeInTheDocument();
    expect(screen.queryByText("Add Place")).not.toBeInTheDocument();
  });

  it("never shows Copy Coordinates — the entry is gone (TD-96)", () => {
    renderMenu();
    expect(screen.queryByText("Copy Coordinates")).not.toBeInTheDocument();
    expect(screen.queryByText("Copia coordinate")).not.toBeInTheDocument();
  });

  it("shows Add Place when onAddPOI is provided", () => {
    renderMenu();
    expect(screen.getByText("Add Place")).toBeInTheDocument();
  });

  it("hides Add Place when hideAddPlace is true, even with onAddPOI provided (SPEC-009 T4)", () => {
    renderMenu({ hideAddPlace: true });
    expect(screen.queryByText("Add Place")).not.toBeInTheDocument();
    // Unaffected entries stay.
    expect(screen.getByText("Add Marker")).toBeInTheDocument();
    expect(screen.getByText("Measure")).toBeInTheDocument();
  });

  it("calls onAddMarker with the clicked coordinates, then closes", () => {
    const { onAddMarker, onClose } = renderMenu();

    fireEvent.click(screen.getByText("Add Marker"));

    expect(onAddMarker).toHaveBeenCalledWith(12.3456, 65.4321);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onStartMeasurement, then closes", () => {
    const { onStartMeasurement, onClose } = renderMenu();

    fireEvent.click(screen.getByText("Measure"));

    expect(onStartMeasurement).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onAddPOI with the clicked coordinates, then closes", () => {
    const { onAddPOI, onClose } = renderMenu();

    fireEvent.click(screen.getByText("Add Place"));

    expect(onAddPOI).toHaveBeenCalledWith(12.3456, 65.4321);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not show Add sub-map or Attach entity without their handlers (usability fix, 2026-08-17)", () => {
    renderMenu();
    expect(screen.queryByText("Add sub-map")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Attach an existing entity")
    ).not.toBeInTheDocument();
  });

  it("shows Add sub-map when onAddSubMap is provided", () => {
    renderMenu({ onAddSubMap: vi.fn() });
    expect(screen.getByText("Add sub-map")).toBeInTheDocument();
  });

  it("hides Add sub-map inside an existing area, the same containment rule as Add Place", () => {
    renderMenu({ onAddSubMap: vi.fn(), hideAddPlace: true });
    expect(screen.queryByText("Add sub-map")).not.toBeInTheDocument();
  });

  it("calls onAddSubMap then closes when Add sub-map is clicked", () => {
    const onAddSubMap = vi.fn();
    const { onClose } = renderMenu({ onAddSubMap });

    fireEvent.click(screen.getByText("Add sub-map"));

    expect(onAddSubMap).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  // SPEC-016 T8 removed the "Collega un personaggio esistente" entry from
  // this menu (TD-96) — attaching is now an action inside the clicked
  // place's own popover, where the DM can see what is already there. The
  // regression guard is below rather than the two tests that used to
  // exercise the entry.
  it("no longer offers an attach-entity entry (SPEC-016 T8, TD-96)", () => {
    renderMenu();

    expect(
      screen.queryByText("Attach an existing entity")
    ).not.toBeInTheDocument();
  });

  // TD-104 (the DM, 2026-08-30) — the menu had an "Edit Area" entry, shown
  // over an area, that armed SPEC-009 T5's redraw. It is gone: `PlacePopover`
  // reaches the same gesture from the place itself. `onEditArea`,
  // `showEditArea` and `editAreaLabel` are no longer props, so the compiler
  // stops one coming back by accident; this asserts the rendered menu, since
  // nothing over an area should offer it any more.
  it("offers no area-editing entry, over an area or otherwise (TD-104)", () => {
    renderMenu({ hideAddPlace: true });

    expect(screen.queryByText("Edit Area")).not.toBeInTheDocument();
    expect(screen.queryByText("Modifica area")).not.toBeInTheDocument();
  });

  it("renders translated copy for the always-shown items when provided, in place of the English defaults", () => {
    renderMenu({
      addMarkerLabel: "Aggiungi marker",
      addMarkerSublabel: "Posiziona un marker qui",
      measureLabel: "Misura",
      measureSublabel: "Avvia la misurazione della distanza",
      addPlaceLabel: "Aggiungi luogo",
      addPlaceSublabel: "Crea un luogo qui",
      ariaLabel: "Menu contestuale della mappa",
    });

    expect(screen.getByText("Aggiungi marker")).toBeInTheDocument();
    expect(screen.getByText("Posiziona un marker qui")).toBeInTheDocument();
    expect(screen.getByText("Misura")).toBeInTheDocument();
    expect(
      screen.getByText("Avvia la misurazione della distanza")
    ).toBeInTheDocument();
    expect(screen.getByText("Aggiungi luogo")).toBeInTheDocument();
    expect(screen.getByText("Crea un luogo qui")).toBeInTheDocument();
    expect(
      screen.getByRole("menu", { name: "Menu contestuale della mappa" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Add Marker")).not.toBeInTheDocument();
    expect(screen.queryByText("Measure")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Place")).not.toBeInTheDocument();
  });

  it("falls back to the English defaults when no translated copy is provided", () => {
    renderMenu();

    expect(
      screen.getByRole("menu", { name: "Map context menu" })
    ).toBeInTheDocument();
  });

  it("closes on outside click but not on a click inside the menu", async () => {
    const { onClose } = renderMenu();

    // The outside-click listener attaches after a 0ms timeout (to avoid
    // closing from the same contextmenu event that opened it) — let it run.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    fireEvent.mouseDown(screen.getByText("Add Marker"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("MapContextMenu — Posiziona luogo (TD-85)", () => {
  const unplacedPlaces = [
    {
      id: 5,
      title: "Kingdom of Kang",
      kind: "region" as const,
      parentId: 1,
      parentTitle: "Terra",
    },
    {
      id: 6,
      title: "Skreebars",
      kind: "city" as const,
      parentId: 2,
      parentTitle: "Regno di Kang",
    },
  ];

  it("does not show the entry without onPositionPlace", () => {
    renderMenu();
    expect(screen.queryByText("Position a place")).not.toBeInTheDocument();
  });

  it("shows the entry, translated, when onPositionPlace is provided", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces,
      positionPlaceLabel: "Posiziona luogo",
    });
    expect(screen.getByText("Posiziona luogo")).toBeInTheDocument();
  });

  it("hides the entry inside an existing area, the same containment rule as Add Place", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces,
      hideAddPlace: true,
    });
    expect(screen.queryByText("Position a place")).not.toBeInTheDocument();
  });

  it("is disabled when there is nothing here to place, so it stays visible rather than vanishing", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces: [],
    });

    const trigger = screen.getByText("Position a place").closest("button")!;
    expect(trigger).toBeDisabled();
  });

  // TD-103 — the entry used to be disabled on a *tree-wide* count while the
  // dropdown was filled from this per-place list. Every test above paired
  // the two in step, which is exactly why the split never showed: an empty
  // list with a non-zero count is the state a DM hits on any map whose own
  // children are all placed, and it rendered an enabled entry that opened
  // nothing.
  it("is disabled when the tree has unplaced places but this map has none of them", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces: [],
      positionPlaceSublabel: "41 luoghi non ancora posizionati",
    });

    const trigger = screen.getByText("Position a place").closest("button")!;
    expect(trigger).toBeDisabled();
    // The awareness number still renders — it is information about the
    // campaign, not a claim that any of it is reachable from here.
    expect(
      screen.getByText("41 luoghi non ancora posizionati")
    ).toBeInTheDocument();
  });

  it("is enabled when this map has something to place", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces,
    });

    const trigger = screen.getByText("Position a place").closest("button")!;
    expect(trigger).not.toBeDisabled();
  });

  it("shows the count as the entry's sublabel when given", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces,
      positionPlaceSublabel: "2 luoghi non ancora posizionati",
    });
    expect(
      screen.getByText("2 luoghi non ancora posizionati")
    ).toBeInTheDocument();
  });

  it("expands a dropdown of the unplaced places when clicked", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces,
    });

    expect(screen.queryByText("Kingdom of Kang")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Position a place"));

    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();
    expect(screen.getByText("Skreebars")).toBeInTheDocument();
  });

  it("does nothing when the disabled entry is clicked — no dropdown opens", () => {
    renderMenu({
      onPositionPlace: vi.fn(),
      unplacedPlaces: [],
    });

    fireEvent.click(screen.getByText("Position a place"));

    expect(screen.queryByText("Kingdom of Kang")).not.toBeInTheDocument();
  });

  it("positions the picked place at the point the menu was opened over, then closes", () => {
    const onPositionPlace = vi.fn();
    const { onClose } = renderMenu({
      onPositionPlace,
      unplacedPlaces,
    });

    fireEvent.click(screen.getByText("Position a place"));
    fireEvent.click(screen.getByText("Kingdom of Kang"));

    expect(onPositionPlace).toHaveBeenCalledWith(5, 12.3456, 65.4321);
    expect(onClose).toHaveBeenCalled();
  });
});
