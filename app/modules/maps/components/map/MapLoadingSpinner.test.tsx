import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapLoadingSpinner } from "./MapLoadingSpinner";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";

// TD-95 — "Loading map..." was hardcoded English straight in the JSX,
// found while sweeping this file's neighbours after MapPOIPanel's own
// hardcoded copy. `MapLoadingSpinner` is production-reachable
// (`GeographyExplorer` renders it on every `/dashboard/geography` load
// until the map is ready), so this isn't scaffolding for something
// unfinished.

describe("MapLoadingSpinner", () => {
  it("shows the translated loading text, not the old hardcoded English", () => {
    render(
      <MapProvider>
        <MapLoadingSpinner />
      </MapProvider>
    );

    // The global next-intl mock (vitest.setup.ts) returns the raw key.
    expect(screen.getByText("loadingMap")).toBeInTheDocument();
    expect(screen.queryByText("Loading map...")).not.toBeInTheDocument();
  });

  it("throws when rendered outside a MapProvider, same as before", () => {
    // Errors thrown during render log to the console; suppress that noise
    // for this expected-to-throw assertion.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<MapLoadingSpinner />)).toThrow(
      "MapLoadingSpinner must be used within a MapProvider"
    );

    consoleError.mockRestore();
  });
});
