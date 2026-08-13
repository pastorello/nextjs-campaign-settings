import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
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

  it("shows Add Marker, Measure and Copy Coordinates, but not Add Place without onAddPOI", () => {
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
    expect(screen.getByText("Copy Coordinates")).toBeInTheDocument();
    expect(screen.queryByText("Add Place")).not.toBeInTheDocument();
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
    expect(screen.getByText("Copy Coordinates")).toBeInTheDocument();
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

  it("copies the formatted coordinates to the clipboard and shows feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderMenu();

    fireEvent.click(screen.getByText("Copy Coordinates"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("12.345600, 65.432100");
    });
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
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
