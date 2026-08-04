import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { MeasurementMode } from "@/app/modules/maps/hooks/useMeasurement";

const startMeasurement = vi.fn();
const clearMeasurement = vi.fn();
const undoLastPoint = vi.fn();
const finishMeasurement = vi.fn();

let hookState: {
  mode: MeasurementMode;
  distance: number;
  area: number;
  pointCount: number;
};

vi.mock("@/app/modules/maps/hooks/useMeasurement", () => ({
  useMeasurement: () => ({
    ...hookState,
    startMeasurement,
    clearMeasurement,
    undoLastPoint,
    finishMeasurement,
  }),
}));

import { MapMeasurementPanel } from "./MapMeasurementPanel";

beforeEach(() => {
  vi.clearAllMocks();
  hookState = { mode: null, distance: 0, area: 0, pointCount: 0 };
});

describe("MapMeasurementPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <MapMeasurementPanel isOpen={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("prompts to select a mode when open and idle", () => {
    render(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByText("Select a measurement mode")).toBeInTheDocument();
  });

  it("starts distance mode on first click, clears it on a second click of the same tab", () => {
    const { rerender } = render(
      <MapMeasurementPanel isOpen onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByTitle("Distance"));
    expect(startMeasurement).toHaveBeenCalledWith("distance");

    hookState.mode = "distance";
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Distance"));
    expect(clearMeasurement).toHaveBeenCalled();
  });

  it("starts area mode on first click", () => {
    render(<MapMeasurementPanel isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Area"));
    expect(startMeasurement).toHaveBeenCalledWith("area");
  });

  it("shows the point count and a placeholder distance until there are 2+ points", () => {
    hookState = { mode: "distance", distance: 0, area: 0, pointCount: 1 };
    render(<MapMeasurementPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("formats a sub-kilometre distance in metres, and a longer one in kilometres", () => {
    hookState = { mode: "distance", distance: 456.789, area: 0, pointCount: 2 };
    const { rerender } = render(
      <MapMeasurementPanel isOpen onClose={vi.fn()} />
    );
    expect(screen.getByText("456.79 m")).toBeInTheDocument();

    hookState = { mode: "distance", distance: 4567.89, area: 0, pointCount: 2 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByText("4.57 km")).toBeInTheDocument();
  });

  it("formats area in m², ha or km² depending on magnitude", () => {
    hookState = { mode: "area", distance: 0, area: 5000, pointCount: 3 };
    const { rerender } = render(
      <MapMeasurementPanel isOpen onClose={vi.fn()} />
    );
    expect(screen.getByText("5000.00 m²")).toBeInTheDocument();

    hookState = { mode: "area", distance: 0, area: 50000, pointCount: 3 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByText("5.00 ha")).toBeInTheDocument();

    hookState = { mode: "area", distance: 0, area: 5000000, pointCount: 3 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByText("5.00 km²")).toBeInTheDocument();
  });

  it("disables Undo with no points, and Done below the mode's minimum point count", () => {
    hookState = { mode: "distance", distance: 0, area: 0, pointCount: 0 };
    const { rerender } = render(
      <MapMeasurementPanel isOpen onClose={vi.fn()} />
    );
    expect(screen.getByTitle("Undo")).toBeDisabled();
    expect(screen.getByTitle("Done")).toBeDisabled();

    hookState = { mode: "distance", distance: 10, area: 0, pointCount: 2 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByTitle("Undo")).not.toBeDisabled();
    expect(screen.getByTitle("Done")).not.toBeDisabled();

    hookState = { mode: "area", distance: 0, area: 0, pointCount: 2 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByTitle("Done")).toBeDisabled();
  });

  it("Clear calls clearMeasurement; Undo calls undoLastPoint", () => {
    hookState = { mode: "distance", distance: 10, area: 0, pointCount: 2 };
    render(<MapMeasurementPanel isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Clear"));
    expect(clearMeasurement).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Undo"));
    expect(undoLastPoint).toHaveBeenCalled();
  });

  it("finishing keeps the last distance visible once the hook's mode resets to idle", () => {
    hookState = { mode: "distance", distance: 1234, area: 0, pointCount: 2 };
    const { rerender } = render(
      <MapMeasurementPanel isOpen onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByTitle("Done"));
    expect(finishMeasurement).toHaveBeenCalled();

    // The hook itself resets mode to null on finish (mocked here since the
    // hook is stubbed) — the panel's own lastMeasurement state, set at the
    // same click, is what keeps the result on screen through that reset.
    hookState = { mode: null, distance: 0, area: 0, pointCount: 0 };
    rerender(<MapMeasurementPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText("Distance:")).toBeInTheDocument();
    expect(screen.getByText("1.23 km")).toBeInTheDocument();
  });

  it("closing clears the measurement and calls onClose", () => {
    const onClose = vi.fn();
    hookState = { mode: "distance", distance: 10, area: 0, pointCount: 2 };
    render(<MapMeasurementPanel isOpen onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Close measurement tools"));

    expect(clearMeasurement).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
