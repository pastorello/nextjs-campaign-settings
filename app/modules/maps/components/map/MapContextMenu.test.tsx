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

  it("shows Attach entity when onAttachEntity is provided, translated when given", () => {
    renderMenu({
      onAttachEntity: vi.fn(),
      attachEntityLabel: "Collega un personaggio esistente",
    });
    expect(
      screen.getByText("Collega un personaggio esistente")
    ).toBeInTheDocument();
  });

  it("calls onAttachEntity then closes when Attach entity is clicked", () => {
    const onAttachEntity = vi.fn();
    const { onClose } = renderMenu({ onAttachEntity });

    fireEvent.click(screen.getByText("Attach an existing entity"));

    expect(onAttachEntity).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not show Edit Area without onEditArea or showEditArea (SPEC-009 T5)", () => {
    renderMenu();
    expect(screen.queryByText("Edit Area")).not.toBeInTheDocument();
  });

  it("does not show Edit Area when onEditArea is provided but showEditArea is false", () => {
    renderMenu({ onEditArea: vi.fn(), showEditArea: false });
    expect(screen.queryByText("Edit Area")).not.toBeInTheDocument();
  });

  it("shows Edit Area with translated copy when armed over an area", () => {
    renderMenu({
      onEditArea: vi.fn(),
      showEditArea: true,
      editAreaLabel: "Modifica area",
      editAreaSublabel: "Ridimensiona o sposta",
    });
    expect(screen.getByText("Modifica area")).toBeInTheDocument();
    expect(screen.getByText("Ridimensiona o sposta")).toBeInTheDocument();
  });

  it("falls back to an English default label when none is provided", () => {
    renderMenu({ onEditArea: vi.fn(), showEditArea: true });
    expect(screen.getByText("Edit Area")).toBeInTheDocument();
  });

  it("calls onEditArea then closes when Edit Area is clicked", () => {
    const onEditArea = vi.fn();
    const { onClose } = renderMenu({
      onEditArea,
      showEditArea: true,
      editAreaLabel: "Edit Area",
    });

    fireEvent.click(screen.getByText("Edit Area"));

    expect(onEditArea).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
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
