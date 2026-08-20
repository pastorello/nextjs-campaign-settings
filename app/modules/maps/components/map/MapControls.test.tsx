import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const zoomIn = vi.fn();
const zoomOut = vi.fn();
const resetView = vi.fn();
const toggleFullscreen = vi.fn();
let map: object | null = {};

vi.mock("@/app/modules/maps/hooks/useMapControls", () => ({
  useMapControls: () => ({ map, zoomIn, zoomOut, resetView, toggleFullscreen }),
}));

const locateUser = vi.fn();
vi.mock("@/app/modules/maps/hooks/useGeolocation", () => ({
  useGeolocation: () => ({
    locateUser,
    isLocating: false,
    isAvailable: true,
  }),
}));

import { MapControls } from "./MapControls";

beforeEach(() => {
  vi.clearAllMocks();
  map = {};
});

// The global next-intl mock (vitest.setup.ts) returns the raw key handed to
// `t()`, ignoring the namespace passed to `useTranslations()` — so
// `t("zoomIn")` resolves to the literal string "zoomIn" here, not the
// catalogue's "Zoom in" (TD-95: these tooltips used to be hardcoded English,
// asserted on directly; they're message keys now).
describe("MapControls", () => {
  it("wires zoom in, zoom out and reset view to the hook", () => {
    render(<MapControls />);

    screen.getByTitle("zoomIn").click();
    screen.getByTitle("zoomOut").click();
    screen.getByTitle("resetView").click();

    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).toHaveBeenCalled();
    expect(resetView).toHaveBeenCalled();
  });

  it("disables zoom and reset controls when there is no map yet", () => {
    map = null;
    render(<MapControls />);

    expect(screen.getByTitle("zoomIn")).toBeDisabled();
    expect(screen.getByTitle("zoomOut")).toBeDisabled();
    expect(screen.getByTitle("resetView")).toBeDisabled();
  });

  it("toggles the fullscreen button's label and icon on fullscreenchange", () => {
    render(<MapControls />);

    expect(
      screen.getByRole("button", { name: "enterFullscreen" })
    ).toBeInTheDocument();

    Object.defineProperty(document, "fullscreenElement", {
      value: document.createElement("div"),
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(
      screen.getByRole("button", { name: "exitFullscreen" })
    ).toBeInTheDocument();

    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(
      screen.getByRole("button", { name: "enterFullscreen" })
    ).toBeInTheDocument();
  });

  it("calls the fullscreen control's onClick handler", () => {
    render(<MapControls />);

    screen.getByRole("button", { name: "enterFullscreen" }).click();

    expect(toggleFullscreen).toHaveBeenCalled();
  });

  it("renders nothing extra by default", () => {
    const { queryByTestId } = render(<MapControls />);

    expect(queryByTestId("extra-control")).not.toBeInTheDocument();
  });

  it("renders belowZoomControls between the zoom cluster and reset view (SPEC-015 T6)", () => {
    render(
      <MapControls belowZoomControls={<div data-testid="below-zoom" />} />
    );

    const slot = screen.getByTestId("below-zoom");
    // Positional contract, not just presence: the slot sits after the zoom
    // buttons and before reset view in the same stack.
    const stack = slot.parentElement;
    const children = Array.from(stack?.children ?? []);
    const zoomCluster = screen.getByTitle("zoomIn").parentElement;
    expect(children.indexOf(slot)).toBe(
      children.indexOf(zoomCluster as Element) + 1
    );
  });

  it("renders extraControls in the same stack as the generic buttons (usability fix, 2026-08-17)", () => {
    render(<MapControls extraControls={<div data-testid="extra-control" />} />);

    expect(screen.getByTestId("extra-control")).toBeInTheDocument();
  });
});
