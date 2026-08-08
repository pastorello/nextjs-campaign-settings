import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the `UNKNOWN_ZONE_PARAM` constant is used from this module, but its
// sibling export (`buildLocationWhere`) statically imports
// `fetchZoneDescendantIds`, which pulls in `@/auth` — mocked here so the
// real next-auth config module never loads.
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/npc",
  useSearchParams: () => searchParams,
}));

const { fetchZones, fetchZoneLandmarks } = vi.hoisted(() => ({
  fetchZones: vi.fn(),
  fetchZoneLandmarks: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchZones", () => ({ default: fetchZones }));
vi.mock("@/app/lib/data/maps/fetchZoneLandmarks", () => ({
  default: fetchZoneLandmarks,
}));

import LocationFilterControl from "./LocationFilterControl";

describe("LocationFilterControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    fetchZones.mockResolvedValue([{ id: 5, title: "Skreebars" }]);
    fetchZoneLandmarks.mockResolvedValue([
      { id: 9, title: "Locanda del Cinghiale Rosso" },
    ]);
  });

  it("does not show the POI select before a real zone is chosen", async () => {
    render(<LocationFilterControl />);

    await waitFor(() => expect(fetchZones).toHaveBeenCalled());
    expect(fetchZoneLandmarks).not.toHaveBeenCalled();
  });

  it("selecting a zone writes zoneId, clears poiId and resets the page", async () => {
    render(<LocationFilterControl />);
    await waitFor(() => expect(fetchZones).toHaveBeenCalled());

    fireEvent.change(
      screen.getByRole("combobox", { name: "common.locationModal.zoneLabel" }),
      {
        target: { value: "5" },
      }
    );

    expect(replace).toHaveBeenCalledWith("/dashboard/npc?zoneId=5&page=1");
  });

  it("shows the POI select scoped to the chosen zone once one is picked", async () => {
    searchParams = new URLSearchParams({ zoneId: "5" });
    render(<LocationFilterControl />);

    await waitFor(() => expect(fetchZoneLandmarks).toHaveBeenCalledWith(5));
    expect(
      screen.getByRole("combobox", { name: "common.locationModal.poiLabel" })
    ).toBeInTheDocument();
  });

  it("selecting Sconosciuta writes the zoneId=none sentinel with no POI select", async () => {
    render(<LocationFilterControl />);
    await waitFor(() => expect(fetchZones).toHaveBeenCalled());

    fireEvent.change(
      screen.getByRole("combobox", { name: "common.locationModal.zoneLabel" }),
      {
        target: { value: "none" },
      }
    );

    expect(replace).toHaveBeenCalledWith("/dashboard/npc?zoneId=none&page=1");
    expect(
      screen.queryByRole("combobox", { name: "common.locationModal.poiLabel" })
    ).not.toBeInTheDocument();
  });

  it("selecting All clears the zone filter entirely", async () => {
    searchParams = new URLSearchParams({ zoneId: "5", poiId: "9" });
    render(<LocationFilterControl />);
    await waitFor(() => expect(fetchZoneLandmarks).toHaveBeenCalled());

    fireEvent.change(
      screen.getByRole("combobox", { name: "common.locationModal.zoneLabel" }),
      {
        target: { value: "" },
      }
    );

    expect(replace).toHaveBeenCalledWith("/dashboard/npc?page=1");
  });

  it("selecting a POI layers poiId on top of the existing zoneId", async () => {
    searchParams = new URLSearchParams({ zoneId: "5" });
    render(<LocationFilterControl />);
    await waitFor(() => expect(fetchZoneLandmarks).toHaveBeenCalled());

    fireEvent.change(
      screen.getByRole("combobox", { name: "common.locationModal.poiLabel" }),
      {
        target: { value: "9" },
      }
    );

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/npc?zoneId=5&poiId=9&page=1"
    );
  });
});
