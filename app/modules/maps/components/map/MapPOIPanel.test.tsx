import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { POI } from "@/app/modules/maps/types/poi";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const fetchLinkableEntities =
  vi.fn<(type: string) => Promise<{ id: number; name: string }[]>>();
vi.mock("@/app/lib/data/maps/fetchLinkableEntities", () => ({
  default: (type: string) => fetchLinkableEntities(type),
}));

import { MapPOIPanel } from "./MapPOIPanel";

const poi: POI = {
  id: "poi-1",
  title: "Skreebars Market",
  description: "A bustling bazaar",
  lat: 12.5,
  lng: -34.2,
  category: "shopping",
  createdAt: 0,
  updatedAt: 0,
};

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    pois: [] as POI[],
    onAddPOI: vi.fn(),
    onUpdatePOI: vi.fn(),
    onDeletePOI: vi.fn(),
    onClearAll: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onFlyTo: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchLinkableEntities.mockResolvedValue([]);
  // jsdom's default innerWidth (1024) already reads as desktop, but pin it
  // explicitly so the panel doesn't take the mobile Drawer branch.
  window.innerWidth = 1024;
});

describe("MapPOIPanel — list view", () => {
  it("shows an empty state with no POIs", () => {
    render(<MapPOIPanel {...baseProps()} />);
    expect(screen.getByText("No places yet")).toBeInTheDocument();
  });

  it("lists every POI with its title and coordinates", () => {
    render(<MapPOIPanel {...baseProps()} pois={[poi]} />);
    expect(screen.getByText("Skreebars Market")).toBeInTheDocument();
    expect(screen.getByText("12.5000, -34.2000")).toBeInTheDocument();
  });

  it("filters the list to filterCategory when given", () => {
    const other: POI = {
      ...poi,
      id: "poi-2",
      title: "Other",
      category: "food-drink",
    };
    render(
      <MapPOIPanel
        {...baseProps()}
        pois={[poi, other]}
        filterCategory="shopping"
      />
    );
    expect(screen.getByText("Skreebars Market")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });

  it("disables Export and Clear with no POIs, enables them with some", () => {
    const { rerender } = render(<MapPOIPanel {...baseProps()} pois={[]} />);
    expect(screen.getByText("Export").closest("button")).toBeDisabled();
    expect(screen.getByText("Clear").closest("button")).toBeDisabled();

    rerender(<MapPOIPanel {...baseProps()} pois={[poi]} />);
    expect(screen.getByText("Export").closest("button")).not.toBeDisabled();
    expect(screen.getByText("Clear").closest("button")).not.toBeDisabled();
  });

  it("calls onExport when Export is clicked", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);
    fireEvent.click(screen.getByText("Export"));
    expect(props.onExport).toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("clears all POIs only after confirming", () => {
    const props = baseProps();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<MapPOIPanel {...props} pois={[poi]} />);

    fireEvent.click(screen.getByText("Clear"));
    expect(props.onClearAll).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByText("Clear"));
    expect(props.onClearAll).toHaveBeenCalled();
  });

  it("flies to a POI when its row is clicked", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);
    fireEvent.click(screen.getByText("Skreebars Market"));
    expect(props.onFlyTo).toHaveBeenCalledWith(poi);
  });

  it("deletes a POI from its hover actions, with a confirmation toast", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);

    const row = screen
      .getByText("Skreebars Market")
      .closest("div")!.parentElement!;
    fireEvent.mouseEnter(row);
    fireEvent.click(screen.getByTitle("Delete"));

    expect(props.onDeletePOI).toHaveBeenCalledWith("poi-1");
    expect(toast.success).toHaveBeenCalledWith('"Skreebars Market" deleted');
  });

  it("imports a file dropped into the hidden file input", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("Import"));
    const file = new File(["{}"], "places.geojson");
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(props.onImport).toHaveBeenCalledWith(file);
  });
});

describe("MapPOIPanel — add/edit form", () => {
  it("rejects saving with no title", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.click(screen.getByText("Save"));

    expect(toast.error).toHaveBeenCalledWith("Please enter a title");
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });

  it("rejects saving with invalid coordinates", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "New Place" },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(toast.error).toHaveBeenCalledWith("Please enter valid coordinates");
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });

  it("adds a POI with the entered title, category and prefilled coordinates", () => {
    const props = baseProps();
    render(
      <MapPOIPanel {...props} initialLat={10.123456} initialLng={20.654321} />
    );

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "New Place" },
    });
    fireEvent.change(screen.getByDisplayValue("🍽️ Food & Drink"), {
      target: { value: "tourism" },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(props.onAddPOI).toHaveBeenCalledWith(
      "New Place",
      10.123456,
      20.654321,
      "tourism",
      undefined,
      null,
      null
    );
    expect(toast.success).toHaveBeenCalledWith("Place added successfully");
  });

  it("returns to the list view after a successful save", () => {
    const props = baseProps();
    render(
      <MapPOIPanel {...props} initialLat={10.123456} initialLng={20.654321} />
    );

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "New Place" },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("No places yet")).toBeInTheDocument();
  });

  it("prefills the form when editing, and updates rather than adds on save", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);

    const row = screen
      .getByText("Skreebars Market")
      .closest("div")!.parentElement!;
    fireEvent.mouseEnter(row);
    fireEvent.click(screen.getByTitle("Edit"));

    expect(screen.getByDisplayValue("Skreebars Market")).toBeInTheDocument();
    expect(screen.getByText("Edit Place")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Skreebars Market"), {
      target: { value: "Renamed Market" },
    });
    fireEvent.click(screen.getByText("Update"));

    expect(props.onUpdatePOI).toHaveBeenCalledWith(
      "poi-1",
      expect.objectContaining({ title: "Renamed Market" })
    );
    expect(toast.success).toHaveBeenCalledWith("Place updated successfully");
  });

  it("fetches linkable entities once a link type is chosen", async () => {
    fetchLinkableEntities.mockResolvedValue([{ id: 1, name: "Gorim" }]);
    const props = baseProps();
    render(<MapPOIPanel {...props} initialLat={1} initialLng={2} />);

    fireEvent.click(screen.getByText("Add"));
    const typeSelect = screen
      .getByText("Linked entity")
      .closest("div")!
      .querySelector("select")!;
    fireEvent.change(typeSelect, { target: { value: "npc" } });

    await waitFor(() =>
      expect(fetchLinkableEntities).toHaveBeenCalledWith("npc")
    );
    expect(await screen.findByText("Gorim")).toBeInTheDocument();
  });

  it("returning Back from the form without saving discards changes", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Abandoned" },
    });
    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByText("No places yet")).toBeInTheDocument();
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });
});
