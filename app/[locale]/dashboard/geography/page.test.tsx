import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/modules/maps/components/map", () => ({
  MapErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MapLoadingSpinner: () => <div data-testid="map-loading-spinner" />,
}));
vi.mock("@/app/modules/maps/contexts/MapContext", () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/app/ui/geography/WorldMap", () => ({
  default: ({ mapUrl }: { mapUrl: string }) => (
    <div data-testid="world-map">{mapUrl}</div>
  ),
}));

import GeographyPage from "./page";

describe("dashboard geography Page", () => {
  it("renders the first map by default", () => {
    render(<GeographyPage />);

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/maps/piani-esistenza.jpg"
    );
  });

  it("switches the rendered map when another option is clicked", () => {
    render(<GeographyPage />);

    fireEvent.click(screen.getByText("maps.materialWorld"));

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/maps/mondo-materiale.jpg"
    );
  });

  it("highlights only the currently selected map's button", () => {
    render(<GeographyPage />);
    const planesButton = () =>
      screen.getByText("maps.planesOfExistence").closest("button");
    const materialButton = () =>
      screen.getByText("maps.materialWorld").closest("button");

    expect(planesButton()).toHaveClass("bg-violet-700");
    expect(materialButton()).not.toHaveClass("bg-violet-700");

    fireEvent.click(screen.getByText("maps.materialWorld"));

    expect(materialButton()).toHaveClass("bg-violet-700");
    expect(planesButton()).not.toHaveClass("bg-violet-700");
  });
});
