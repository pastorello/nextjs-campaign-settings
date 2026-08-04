import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MapDetailsPanel } from "./MapDetailsPanel";

function feature(properties: Record<string, unknown>) {
  return {
    type: "Feature",
    properties,
    geometry: { type: "Point", coordinates: [0, 0] },
  } as unknown as GeoJSON.Feature;
}

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
  // jsdom's default innerWidth (1024) already reads as desktop; pinning it
  // documents the choice and matches MapPOIPanel.test.tsx's own convention
  // of exercising the desktop shape, not the mobile Drawer branch.
  window.innerWidth = 1024;
});

describe("MapDetailsPanel", () => {
  it("renders nothing when there is no country", () => {
    const { container } = render(
      <MapDetailsPanel country={null} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the country name and code, falling back to 'Unknown' without a name", () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);

    render(<MapDetailsPanel country={feature({})} onClose={vi.fn()} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("shows the country name and ISO code from feature properties", () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);

    render(
      <MapDetailsPanel
        country={feature({ NAME: "Italy", ISO_A3: "ITA", ISO_A2: "IT" })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Italy")).toBeInTheDocument();
    expect(screen.getByText("ITA")).toBeInTheDocument();
  });

  it("fetches country info by ISO_A2 and renders population, area, capital and currency", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: { official: "Italian Republic" },
            region: "Europe",
            subregion: "Southern Europe",
            capital: ["Rome"],
            population: 60000000,
            area: 301340,
            currencies: { EUR: { name: "Euro" } },
            languages: { ita: "Italian" },
          },
        ]),
    } as Response);

    render(
      <MapDetailsPanel
        country={feature({ NAME: "Italy", ISO_A3: "ITA", ISO_A2: "IT" })}
        onClose={vi.fn()}
      />
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://restcountries.com/v3.1/alpha/IT"
    );

    expect(await screen.findByText("Rome")).toBeInTheDocument();
    expect(screen.getByText("60,000,000")).toBeInTheDocument();
    expect(screen.getByText("301,340 km²")).toBeInTheDocument();
    expect(screen.getByText("Euro")).toBeInTheDocument();
    expect(screen.getByText("Italian")).toBeInTheDocument();
  });

  it("does not fetch when the feature has no ISO_A2 code", () => {
    render(
      <MapDetailsPanel
        country={feature({ NAME: "Nowhere" })}
        onClose={vi.fn()}
      />
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("logs and keeps the loading state when the fetch fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));

    render(
      <MapDetailsPanel
        country={feature({ NAME: "Italy", ISO_A2: "IT" })}
        onClose={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "Error fetching country info:",
        expect.any(Error)
      )
    );
    consoleError.mockRestore();
  });

  it("calls onClose when the desktop close button is clicked", () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);
    const onClose = vi.fn();

    render(
      <MapDetailsPanel country={feature({ NAME: "Italy" })} onClose={onClose} />
    );

    screen.getByRole("button", { name: "Close" }).click();

    expect(onClose).toHaveBeenCalled();
  });
});
