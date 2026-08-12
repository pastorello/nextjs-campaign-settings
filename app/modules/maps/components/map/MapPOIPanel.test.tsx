import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { POI } from "@/app/modules/maps/types/poi";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
    onAddPlace: vi.fn().mockResolvedValue({ ok: true }),
    unplacedChildren: [],
    onPositionPlace: vi.fn(),
    positioningPlaceId: null,
    pendingFootprint: null,
    onFootprintConsumed: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
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

describe("MapPOIPanel — unplaced places (TD-71, SPEC-005 §5.A)", () => {
  it("renders no section when there are no unplaced children", () => {
    render(<MapPOIPanel {...baseProps()} />);
    expect(screen.queryByText(/Unplaced places/)).not.toBeInTheDocument();
  });

  it("lists each unplaced child with its title, kind and a count", () => {
    render(
      <MapPOIPanel
        {...baseProps()}
        unplacedChildren={[
          { id: 1, title: "Kingdom of Kang", kind: "region" },
          { id: 2, title: "Skreebars", kind: "city" },
        ]}
      />
    );

    expect(screen.getByText("Unplaced places (2)")).toBeInTheDocument();
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();
    expect(screen.getByText("region")).toBeInTheDocument();
    expect(screen.getByText("Skreebars")).toBeInTheDocument();
    expect(screen.getByText("city")).toBeInTheDocument();
  });

  it("calls onPositionPlace with the chosen child's id", () => {
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        unplacedChildren={[{ id: 7, title: "Kingdom of Kang", kind: "region" }]}
      />
    );

    fireEvent.click(screen.getByText("Position on map"));

    expect(props.onPositionPlace).toHaveBeenCalledWith(7);
  });

  it("shows the positioning state and cancels it on a second click", () => {
    const props = baseProps();
    const { rerender } = render(
      <MapPOIPanel
        {...props}
        unplacedChildren={[{ id: 7, title: "Kingdom of Kang", kind: "region" }]}
        positioningPlaceId={7}
      />
    );

    fireEvent.click(screen.getByText("Click on map (cancel)"));
    expect(props.onPositionPlace).toHaveBeenCalledWith(7);

    rerender(
      <MapPOIPanel
        {...props}
        unplacedChildren={[{ id: 7, title: "Kingdom of Kang", kind: "region" }]}
        positioningPlaceId={null}
      />
    );
    expect(screen.getByText("Position on map")).toBeInTheDocument();
  });

  it("collapses and expands the section on click, without affecting the POI list", () => {
    render(
      <MapPOIPanel
        {...baseProps()}
        pois={[poi]}
        unplacedChildren={[{ id: 7, title: "Kingdom of Kang", kind: "region" }]}
      />
    );

    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Unplaced places (1)"));
    expect(screen.queryByText("Kingdom of Kang")).not.toBeInTheDocument();
    expect(screen.getByText("Skreebars Market")).toBeInTheDocument();
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
    fireEvent.change(
      screen.getByDisplayValue("🍽️ geography.poiCategories.foodDrink"),
      { target: { value: "tourism" } }
    );
    fireEvent.click(screen.getByText("Save"));

    expect(props.onAddPOI).toHaveBeenCalledWith(
      "New Place",
      10.123456,
      20.654321,
      "tourism",
      undefined
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

describe("MapPOIPanel — kind selector (SPEC-004 M5)", () => {
  function kindSelect() {
    return screen.getByText("Kind").closest("div")!.querySelector("select")!;
  }

  it("defaults to poi, with category visible", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("Add"));

    expect(kindSelect()).toHaveValue("poi");
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("switching to region hides category and shows the map image field", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("Add"));

    fireEvent.change(kindSelect(), { target: { value: "region" } });

    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.getByText("Map image")).toBeInTheDocument();
  });

  it("lists the T2 navigable kinds alongside region", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("Add"));

    const values = [...kindSelect().querySelectorAll("option")].map((o) =>
      o.getAttribute("value")
    );
    expect(values).toEqual(
      expect.arrayContaining(["region", "plane", "city", "dungeon"])
    );
  });

  it("switching to city (T2) hides category and shows the map image field", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("Add"));

    fireEvent.change(kindSelect(), { target: { value: "city" } });

    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.getByText("Map image")).toBeInTheDocument();
  });

  it("no longer offers deity/npc as a creatable kind (SPEC-008 T5)", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("Add"));

    const values = [...kindSelect().querySelectorAll("option")].map((o) =>
      o.getAttribute("value")
    );
    expect(values).not.toEqual(expect.arrayContaining(["deity", "npc"]));
  });

  it("rejects saving a region with no map image chosen", async () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} initialLat={1} initialLng={2} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Kingdom of Kang" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Please choose a map image")
    );
    expect(props.onAddPlace).not.toHaveBeenCalled();
  });

  it("uploads the map and creates a region", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "kang.png" }),
      })
    );
    const props = baseProps();
    render(<MapPOIPanel {...props} initialLat={1} initialLng={2} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Kingdom of Kang" },
    });
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen.getByText("Map image").closest("div")!.querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(props.onAddPlace).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/maps/upload",
      expect.objectContaining({ method: "POST" })
    );
    expect(props.onAddPlace).toHaveBeenCalledWith({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
    });
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Place added successfully")
    );
  });

  it("shows the server's own refusal message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "kang.png" }),
      })
    );
    const props = baseProps();
    props.onAddPlace.mockResolvedValue({
      ok: false,
      error: "Overlaps an existing area: Kingdom of Kang.",
    });
    render(<MapPOIPanel {...props} initialLat={1} initialLng={2} />);

    fireEvent.click(screen.getByText("Add"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Nod" },
    });
    const file = new File(["bytes"], "nod.png", { type: "image/png" });
    fireEvent.change(
      screen.getByText("Map image").closest("div")!.querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Overlaps an existing area: Kingdom of Kang."
      )
    );
  });

  it("does not show the kind selector while editing", () => {
    render(<MapPOIPanel {...baseProps()} pois={[poi]} />);

    const row = screen
      .getByText("Skreebars Market")
      .closest("div")!.parentElement!;
    fireEvent.mouseEnter(row);
    fireEvent.click(screen.getByTitle("Edit"));

    expect(screen.queryByText("Kind")).not.toBeInTheDocument();
  });
});

describe("MapPOIPanel — draw-an-area flow (SPEC-009 T2)", () => {
  const footprint: Footprint = [
    [0, 0],
    [10, 20],
  ];

  function kindSelect() {
    return screen.getByText("Kind").closest("div")!.querySelector("select")!;
  }

  it("restricts the kind selector to the navigable kinds", () => {
    render(
      <MapPOIPanel
        {...baseProps()}
        mode="add"
        onModeChange={vi.fn()}
        pendingFootprint={footprint}
      />
    );

    const values = [...kindSelect().querySelectorAll("option")].map((o) =>
      o.getAttribute("value")
    );
    expect(values).toEqual(["region", "plane", "city", "dungeon"]);
  });

  it("replaces the coordinate picker with a read-only centre readout", () => {
    render(
      <MapPOIPanel
        {...baseProps()}
        mode="add"
        onModeChange={vi.fn()}
        pendingFootprint={footprint}
      />
    );

    expect(screen.getByText("5.0000, 10.0000")).toBeInTheDocument();
    expect(
      screen.queryByText("Click to select location on map")
    ).not.toBeInTheDocument();
  });

  it("saves with the footprint and its derived centre, not typed coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "kang.png" }),
      })
    );
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        mode="add"
        onModeChange={vi.fn()}
        pendingFootprint={footprint}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Kingdom of Kang" },
    });
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen.getByText("Map image").closest("div")!.querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(props.onAddPlace).toHaveBeenCalled());
    expect(props.onAddPlace).toHaveBeenCalledWith({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 5,
      lng: 10,
      mapImage: "kang.png",
      footprint,
    });
  });

  it("consumes the footprint after a successful save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "kang.png" }),
      })
    );
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        mode="add"
        onModeChange={vi.fn()}
        pendingFootprint={footprint}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Enter place name"), {
      target: { value: "Kingdom of Kang" },
    });
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen.getByText("Map image").closest("div")!.querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(props.onFootprintConsumed).toHaveBeenCalled());
  });

  it("consumes the footprint when the Back button is used to abandon the draw", () => {
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        mode="add"
        onModeChange={vi.fn()}
        pendingFootprint={footprint}
      />
    );

    fireEvent.click(screen.getByText("Back"));

    expect(props.onFootprintConsumed).toHaveBeenCalled();
  });

  it("consumes a stale footprint when starting a fresh, non-area add", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pendingFootprint={footprint} />);

    fireEvent.click(screen.getByText("Add"));

    expect(props.onFootprintConsumed).toHaveBeenCalled();
  });
});
