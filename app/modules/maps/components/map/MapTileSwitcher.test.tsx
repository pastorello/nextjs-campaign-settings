import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapTileSwitcher } from "./MapTileSwitcher";

describe("MapTileSwitcher", () => {
  it("shows the selected provider's label on the main button", () => {
    render(
      <MapTileSwitcher
        selectedProviderId="satellite"
        onProviderChange={vi.fn()}
      />
    );

    expect(
      within(
        screen.getByRole("button", { name: "Tile layer options" })
      ).getByText("Satellite")
    ).toBeInTheDocument();
  });

  it("falls back to the first layer option for an unknown provider id", () => {
    render(
      <MapTileSwitcher
        selectedProviderId="not-a-real-id"
        onProviderChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Tile layer options" })
    ).toBeInTheDocument();
  });

  it("calls onProviderChange with the clicked layer's id", () => {
    const onProviderChange = vi.fn();
    render(
      <MapTileSwitcher
        selectedProviderId="osm"
        onProviderChange={onProviderChange}
      />
    );

    screen.getByTitle("Dark").click();

    expect(onProviderChange).toHaveBeenCalledWith("dark");
  });

  it("marks the currently selected layer button", () => {
    render(
      <MapTileSwitcher selectedProviderId="dark" onProviderChange={vi.fn()} />
    );

    expect(screen.getByTitle("Dark")).not.toBeDisabled();
    expect(screen.getByTitle("Basic")).not.toBeDisabled();
  });
});
