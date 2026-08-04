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

describe("MapControls", () => {
  it("wires zoom in, zoom out and reset view to the hook", () => {
    render(<MapControls />);

    screen.getByTitle("Zoom in").click();
    screen.getByTitle("Zoom out").click();
    screen.getByTitle("Reset view").click();

    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).toHaveBeenCalled();
    expect(resetView).toHaveBeenCalled();
  });

  it("disables zoom and reset controls when there is no map yet", () => {
    map = null;
    render(<MapControls />);

    expect(screen.getByTitle("Zoom in")).toBeDisabled();
    expect(screen.getByTitle("Zoom out")).toBeDisabled();
    expect(screen.getByTitle("Reset view")).toBeDisabled();
  });

  it("toggles the fullscreen button's label and icon on fullscreenchange", () => {
    render(<MapControls />);

    expect(
      screen.getByRole("button", { name: "Enter fullscreen" })
    ).toBeInTheDocument();

    Object.defineProperty(document, "fullscreenElement", {
      value: document.createElement("div"),
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(
      screen.getByRole("button", { name: "Exit fullscreen" })
    ).toBeInTheDocument();

    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(
      screen.getByRole("button", { name: "Enter fullscreen" })
    ).toBeInTheDocument();
  });

  it("calls the fullscreen control's onClick handler", () => {
    render(<MapControls />);

    screen.getByRole("button", { name: "Enter fullscreen" }).click();

    expect(toggleFullscreen).toHaveBeenCalled();
  });
});
