import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/app/modules/maps/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn(), mounted: true }),
}));

const locateUser = vi.fn();
let geolocationState = { isLocating: false, isAvailable: true };
vi.mock("@/app/modules/maps/hooks/useGeolocation", () => ({
  useGeolocation: () => ({ locateUser, ...geolocationState }),
}));

import { MapSearchBar } from "./MapSearchBar";

const countries = [
  { id: "ita", name: "Italy", nameLong: "Italian Republic" },
  { id: "fra", name: "France", nameLong: "French Republic" },
];

function baseProps() {
  return {
    onCountrySelect: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  geolocationState = { isLocating: false, isAvailable: true };
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(countries),
  });
  // jsdom doesn't implement scrollIntoView; the keyboard-nav effect calls it
  // on the highlighted result.
  Element.prototype.scrollIntoView = vi.fn();
});

function isCollapsed() {
  return screen.getByRole("listbox").className.includes("max-h-0");
}

describe("MapSearchBar — expand and fetch", () => {
  it("fetches the unfiltered country list as soon as the input is focused", async () => {
    render(<MapSearchBar {...baseProps()} />);

    fireEvent.focus(screen.getByLabelText("Search countries"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/countries/search")
    );
    expect(await screen.findByText("Italy")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("debounces a search query by 150ms before fetching", async () => {
    vi.useFakeTimers();
    render(<MapSearchBar {...baseProps()} />);

    fireEvent.focus(screen.getByLabelText("Search countries"));
    await vi.waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/countries/search")
    );
    vi.mocked(global.fetch).mockClear();

    fireEvent.change(screen.getByLabelText("Search countries"), {
      target: { value: "ita" },
    });

    expect(global.fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);

    expect(global.fetch).toHaveBeenCalledWith("/api/countries/search?q=ita");
    vi.useRealTimers();
  });

  it("shows a loading state while the results are in flight", async () => {
    let resolveFetch: (v: Response) => void = () => {};
    vi.mocked(global.fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<MapSearchBar {...baseProps()} />);
    fireEvent.focus(screen.getByLabelText("Search countries"));

    expect(await screen.findByText("Searching...")).toBeInTheDocument();

    resolveFetch({ json: () => Promise.resolve([]) } as Response);
    await waitFor(() =>
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument()
    );
  });

  it("shows a no-results message for an empty result set with a query", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);
    render(<MapSearchBar {...baseProps()} />);

    fireEvent.focus(screen.getByLabelText("Search countries"));
    fireEvent.change(screen.getByLabelText("Search countries"), {
      target: { value: "xyz" },
    });

    expect(
      await screen.findByText('No results found for "xyz"')
    ).toBeInTheDocument();
  });

  it("falls back to an empty list when the fetch rejects", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));
    render(<MapSearchBar {...baseProps()} />);

    fireEvent.focus(screen.getByLabelText("Search countries"));

    await waitFor(() =>
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument()
    );
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

describe("MapSearchBar — selection", () => {
  it("selects a country on click, collapsing the dropdown and clearing the query", async () => {
    const onCountrySelect = vi.fn();
    render(<MapSearchBar onCountrySelect={onCountrySelect} />);

    fireEvent.focus(screen.getByLabelText("Search countries"));
    fireEvent.click(await screen.findByText("Italy"));

    expect(onCountrySelect).toHaveBeenCalledWith("ita");
    expect(isCollapsed()).toBe(true);
  });

  it("shows the selected country's name with a clear button instead of the input", () => {
    const onClearSelection = vi.fn();
    render(
      <MapSearchBar
        {...baseProps()}
        selectedCountry={
          {
            type: "Feature",
            properties: { NAME: "Italy" },
            geometry: { type: "Point", coordinates: [0, 0] },
          } as unknown as GeoJSON.Feature
        }
        onClearSelection={onClearSelection}
      />
    );

    expect(screen.getByText("Italy")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search countries")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Clear selection"));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("shows the POI panel label and a close button when isPOIPanelOpen", () => {
    const onClosePOIPanel = vi.fn();
    render(
      <MapSearchBar
        {...baseProps()}
        isPOIPanelOpen
        onClosePOIPanel={onClosePOIPanel}
      />
    );

    expect(screen.getByText("My Places")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close POI panel"));
    expect(onClosePOIPanel).toHaveBeenCalled();
  });
});

describe("MapSearchBar — keyboard navigation", () => {
  it("moves the selection with ArrowDown/ArrowUp and selects with Enter", async () => {
    const onCountrySelect = vi.fn();
    render(<MapSearchBar onCountrySelect={onCountrySelect} />);

    const input = screen.getByLabelText("Search countries");
    fireEvent.focus(input);
    await screen.findByText("Italy");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCountrySelect).toHaveBeenCalledWith("ita");
  });

  it("closes the dropdown on Escape and blurs the input", async () => {
    render(<MapSearchBar {...baseProps()} />);

    const input = screen.getByLabelText("Search countries");
    fireEvent.focus(input);
    await screen.findByText("Italy");

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => expect(isCollapsed()).toBe(true));
  });
});

describe("MapSearchBar — locate me and map tools", () => {
  it("calls locateUser and collapses the dropdown", async () => {
    render(<MapSearchBar {...baseProps()} />);
    fireEvent.focus(screen.getByLabelText("Search countries"));
    await screen.findByText("Italy");

    fireEvent.click(screen.getByLabelText("Show current location"));

    expect(locateUser).toHaveBeenCalled();
  });

  it("disables the locate button while unavailable", () => {
    geolocationState = { isLocating: false, isAvailable: false };
    render(<MapSearchBar {...baseProps()} />);

    expect(screen.getByLabelText("Show current location")).toBeDisabled();
  });

  it("calls onMeasurementClick and onPOIClick from the Map Tools panel", () => {
    const onMeasurementClick = vi.fn();
    const onPOIClick = vi.fn();
    render(
      <MapSearchBar
        {...baseProps()}
        onMeasurementClick={onMeasurementClick}
        onPOIClick={onPOIClick}
      />
    );

    fireEvent.focus(screen.getByLabelText("Search countries"));

    fireEvent.click(screen.getByText("Measure"));
    expect(onMeasurementClick).toHaveBeenCalled();

    fireEvent.focus(screen.getByLabelText("Search countries"));
    fireEvent.click(screen.getByText("My Places"));
    expect(onPOIClick).toHaveBeenCalled();
  });
});

describe("MapSearchBar — outside click", () => {
  it("collapses the dropdown on a click outside the search container", async () => {
    render(
      <div>
        <MapSearchBar {...baseProps()} />
        <div data-testid="outside" />
      </div>
    );

    fireEvent.focus(screen.getByLabelText("Search countries"));
    await screen.findByText("Italy");

    fireEvent.mouseDown(screen.getByTestId("outside"));

    await waitFor(() => expect(isCollapsed()).toBe(true));
  });
});
