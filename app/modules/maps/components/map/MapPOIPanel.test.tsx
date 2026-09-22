import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { POI } from "@/app/modules/maps/types/poi";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";

// The formatted description resolves its record links under the route's
// system (SPEC-019 T5), through a provider that renders next-intl's `Link`.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useParams: () => ({ system: "dnd5e" }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

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
    expect(
      screen.getByText("geography.poiPanel.emptyState.title")
    ).toBeInTheDocument();
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
    expect(
      screen.getByText("geography.poiPanel.exportButton").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("geography.poiPanel.clear").closest("button")
    ).toBeDisabled();

    rerender(<MapPOIPanel {...baseProps()} pois={[poi]} />);
    expect(
      screen.getByText("geography.poiPanel.exportButton").closest("button")
    ).not.toBeDisabled();
    expect(
      screen.getByText("geography.poiPanel.clear").closest("button")
    ).not.toBeDisabled();
  });

  it("calls onExport when Export is clicked", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);
    fireEvent.click(screen.getByText("geography.poiPanel.exportButton"));
    expect(props.onExport).toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);
    fireEvent.click(screen.getByLabelText("geography.poiPanel.close"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("opens the app's confirm dialog rather than deleting immediately, and Cancel deletes nothing (TD-123)", async () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);

    fireEvent.click(screen.getByText("geography.poiPanel.clear"));
    // The dialog, not a native `confirm()` — nothing pending on `window.confirm`.
    expect(
      screen.getByText("geography.poiPanel.clearAllConfirm.title")
    ).toBeInTheDocument();
    expect(props.onClearAll).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByText("geography.poiPanel.clearAllConfirm.cancel")
    );
    expect(props.onClearAll).not.toHaveBeenCalled();
    // The Modal exits via a framer-motion animation, so it leaves the DOM
    // asynchronously rather than on this same tick.
    await waitFor(() =>
      expect(
        screen.queryByText("geography.poiPanel.clearAllConfirm.title")
      ).not.toBeInTheDocument()
    );
  });

  it("clears all POIs once the dialog is confirmed, with a translated, plural-aware toast (TD-95, TD-123)", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);

    fireEvent.click(screen.getByText("geography.poiPanel.clear"));
    fireEvent.click(
      screen.getByText("geography.poiPanel.clearAllConfirm.confirm")
    );

    expect(props.onClearAll).toHaveBeenCalled();
    // Used to be a hand-built template literal
    // (`Cleared ${n} place${n !== 1 ? "s" : ""}`) with its own English
    // pluralisation logic. Now next-intl's plural support does that job.
    expect(toast.success).toHaveBeenCalledWith(
      "geography.poiPanel.clearedToast"
    );
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
    fireEvent.click(screen.getByTitle("geography.poiPanel.item.delete"));

    expect(props.onDeletePOI).toHaveBeenCalledWith("poi-1");
    expect(toast.success).toHaveBeenCalledWith(
      "geography.poiPanel.success.deleted"
    );
  });

  it("imports a file dropped into the hidden file input", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("geography.poiPanel.importButton"));
    const file = new File(["{}"], "places.geojson");
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(props.onImport).toHaveBeenCalledWith(file);
  });
});

describe("MapPOIPanel — hardcoded strings swept into the catalogues (TD-95)", () => {
  it("titles the panel with the translated 'Places of Interest' heading, not the old hardcoded 'My Places'", () => {
    render(<MapPOIPanel {...baseProps()} />);
    expect(screen.getByText("geography.poiPanel.title")).toBeInTheDocument();
    expect(screen.queryByText("My Places")).not.toBeInTheDocument();
  });

  it("still shows the category's own label when filterCategory is given, not the panel title", () => {
    render(<MapPOIPanel {...baseProps()} filterCategory="shopping" />);
    expect(
      screen.queryByText("geography.poiPanel.title")
    ).not.toBeInTheDocument();
  });

  it("labels the clear-coordinates button with translated copy, not the old hardcoded title", () => {
    const props = baseProps();
    render(
      <MapPOIPanel {...props} initialLat={10.123456} initialLng={20.654321} />
    );
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    expect(
      screen.getByTitle("geography.poiPanel.clearCoordinates")
    ).toBeInTheDocument();
    expect(screen.queryByTitle("Clear coordinates")).not.toBeInTheDocument();
  });
});

// The unplaced-children picker this panel used to carry is gone (SPEC-016
// T9): TD-85's "Posiziona luogo" context-menu entry is the DM's single
// method for positioning a place, and SPEC-005 §3 records the picker as
// superseded rather than kept alongside. A guard, not coverage — the panel
// takes no `unplacedChildren` prop at all any more, so what this asserts is
// that no second positioning affordance grows back in the list view.
describe("MapPOIPanel — the unplaced-places picker is withdrawn (SPEC-016 T9, TD-85)", () => {
  it("offers no positioning control in the list view", () => {
    render(<MapPOIPanel {...baseProps()} pois={[poi]} />);

    expect(screen.queryByText("Position on map")).not.toBeInTheDocument();
    expect(
      screen.queryByText("geography.poiPanel.unplacedCount")
    ).not.toBeInTheDocument();
  });
});

describe("MapPOIPanel — add/edit form", () => {
  it("rejects saving with no title", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(toast.error).toHaveBeenCalledWith(
      "geography.poiPanel.errors.titleRequired"
    );
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });

  it("rejects saving with invalid coordinates", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "New Place" },
      }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(toast.error).toHaveBeenCalledWith(
      "geography.poiPanel.errors.coordinatesRequired"
    );
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });

  it("adds a POI with the entered title, category and prefilled coordinates", () => {
    const props = baseProps();
    render(
      <MapPOIPanel {...props} initialLat={10.123456} initialLng={20.654321} />
    );

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "New Place" },
      }
    );
    fireEvent.change(
      screen.getByDisplayValue("🍽️ geography.poiCategories.foodDrink"),
      { target: { value: "tourism" } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(props.onAddPOI).toHaveBeenCalledWith(
      "New Place",
      10.123456,
      20.654321,
      "tourism",
      undefined
    );
    expect(toast.success).toHaveBeenCalledWith(
      "geography.poiPanel.success.added"
    );
  });

  it("returns to the list view after a successful save", () => {
    const props = baseProps();
    render(
      <MapPOIPanel {...props} initialLat={10.123456} initialLng={20.654321} />
    );

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "New Place" },
      }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(
      screen.getByText("geography.poiPanel.emptyState.title")
    ).toBeInTheDocument();
  });

  it("prefills the form when editing, and updates rather than adds on save", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pois={[poi]} />);

    const row = screen
      .getByText("Skreebars Market")
      .closest("div")!.parentElement!;
    fireEvent.mouseEnter(row);
    fireEvent.click(screen.getByTitle("geography.poiPanel.item.edit"));

    expect(screen.getByDisplayValue("Skreebars Market")).toBeInTheDocument();
    expect(
      screen.getByText("geography.poiPanel.form.editTitle")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Skreebars Market"), {
      target: { value: "Renamed Market" },
    });
    fireEvent.click(screen.getByText("geography.poiPanel.save.update"));

    expect(props.onUpdatePOI).toHaveBeenCalledWith(
      "poi-1",
      expect.objectContaining({ title: "Renamed Market" })
    );
    expect(toast.success).toHaveBeenCalledWith(
      "geography.poiPanel.success.updated"
    );
  });

  it("returning Back from the form without saving discards changes", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Abandoned" },
      }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.back"));

    expect(
      screen.getByText("geography.poiPanel.emptyState.title")
    ).toBeInTheDocument();
    expect(props.onAddPOI).not.toHaveBeenCalled();
  });
});

describe("MapPOIPanel — externally requested edit (SPEC-016 T7)", () => {
  it("pre-fills the edit form from editTarget, without going through the list row", () => {
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        pois={[poi]}
        mode="edit"
        onModeChange={vi.fn()}
        editTarget={poi}
      />
    );

    // Reached with no hover/click on `POIListItem`'s own row — the popover's
    // "Modifica" (T7) hands this component the POI directly, since the row
    // it would otherwise come from is unreachable (TD-85).
    expect(screen.getByDisplayValue("Skreebars Market")).toBeInTheDocument();
    expect(
      screen.getByText("geography.poiPanel.form.editTitle")
    ).toBeInTheDocument();
  });

  it("updates through onUpdatePOI, the same as an edit reached from the list", () => {
    const props = baseProps();
    render(
      <MapPOIPanel
        {...props}
        pois={[poi]}
        mode="edit"
        onModeChange={vi.fn()}
        editTarget={poi}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Skreebars Market"), {
      target: { value: "Renamed Market" },
    });
    fireEvent.click(screen.getByText("geography.poiPanel.save.update"));

    expect(props.onUpdatePOI).toHaveBeenCalledWith(
      "poi-1",
      expect.objectContaining({ title: "Renamed Market" })
    );
  });

  it("does not re-seed the form from a stale editTarget once the caller clears it", () => {
    const props = baseProps();
    const { rerender } = render(
      <MapPOIPanel
        {...props}
        pois={[poi]}
        mode="edit"
        onModeChange={vi.fn()}
        editTarget={poi}
      />
    );
    fireEvent.change(screen.getByDisplayValue("Skreebars Market"), {
      target: { value: "Mid-edit draft" },
    });

    // The caller (`WorldMap`) leaves `editTarget` referentially stable while
    // the panel stays open — a re-render with the same object must not
    // clobber whatever the DM has typed so far.
    rerender(
      <MapPOIPanel
        {...props}
        pois={[poi]}
        mode="edit"
        onModeChange={vi.fn()}
        editTarget={poi}
      />
    );

    expect(screen.getByDisplayValue("Mid-edit draft")).toBeInTheDocument();
  });
});

describe("MapPOIPanel — kind selector (SPEC-004 M5)", () => {
  function kindSelect() {
    return screen
      .getByText("geography.poiPanel.fields.kind")
      .closest("div")!
      .querySelector("select")!;
  }

  it("defaults to poi, with category visible", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    expect(kindSelect()).toHaveValue("poi");
    expect(
      screen.getByText("geography.poiPanel.fields.category")
    ).toBeInTheDocument();
  });

  it("switching to region hides category and shows the map image field", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    fireEvent.change(kindSelect(), { target: { value: "region" } });

    expect(
      screen.queryByText("geography.poiPanel.fields.category")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("geography.poiPanel.fields.mapImage")
    ).toBeInTheDocument();
  });

  it("lists the T2 navigable kinds alongside region", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    const values = [...kindSelect().querySelectorAll("option")].map((o) =>
      o.getAttribute("value")
    );
    expect(values).toEqual(
      expect.arrayContaining(["region", "plane", "city", "dungeon"])
    );
  });

  it("switching to city (T2) hides category and shows the map image field", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    fireEvent.change(kindSelect(), { target: { value: "city" } });

    expect(
      screen.queryByText("geography.poiPanel.fields.category")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("geography.poiPanel.fields.mapImage")
    ).toBeInTheDocument();
  });

  it("no longer offers deity/npc as a creatable kind (SPEC-008 T5)", () => {
    render(<MapPOIPanel {...baseProps()} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    const values = [...kindSelect().querySelectorAll("option")].map((o) =>
      o.getAttribute("value")
    );
    expect(values).not.toEqual(expect.arrayContaining(["deity", "npc"]));
  });

  it("rejects saving a region with no map image chosen", async () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} initialLat={1} initialLng={2} />);

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Kingdom of Kang" },
      }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "geography.poiPanel.errors.mapImageRequired"
      )
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

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Kingdom of Kang" },
      }
    );
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen
        .getByText("geography.poiPanel.fields.mapImage")
        .closest("div")!
        .querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

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
      expect(toast.success).toHaveBeenCalledWith(
        "geography.poiPanel.success.added"
      )
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

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    fireEvent.change(kindSelect(), { target: { value: "region" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Nod" },
      }
    );
    const file = new File(["bytes"], "nod.png", { type: "image/png" });
    fireEvent.change(
      screen
        .getByText("geography.poiPanel.fields.mapImage")
        .closest("div")!
        .querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

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
    fireEvent.click(screen.getByTitle("geography.poiPanel.item.edit"));

    expect(
      screen.queryByText("geography.poiPanel.fields.kind")
    ).not.toBeInTheDocument();
  });
});

describe("MapPOIPanel — draw-an-area flow (SPEC-009 T2)", () => {
  const footprint: Footprint = [
    [0, 0],
    [10, 20],
  ];

  function kindSelect() {
    return screen
      .getByText("geography.poiPanel.fields.kind")
      .closest("div")!
      .querySelector("select")!;
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
      screen.queryByText("geography.poiPanel.selectLocation.prompt")
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

    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Kingdom of Kang" },
      }
    );
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen
        .getByText("geography.poiPanel.fields.mapImage")
        .closest("div")!
        .querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

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

    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      {
        target: { value: "Kingdom of Kang" },
      }
    );
    const file = new File(["bytes"], "kang.png", { type: "image/png" });
    fireEvent.change(
      screen
        .getByText("geography.poiPanel.fields.mapImage")
        .closest("div")!
        .querySelector("input")!,
      { target: { files: [file] } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

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

    fireEvent.click(screen.getByText("geography.poiPanel.back"));

    expect(props.onFootprintConsumed).toHaveBeenCalled();
  });

  it("consumes a stale footprint when starting a fresh, non-area add", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} pendingFootprint={footprint} />);

    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    expect(props.onFootprintConsumed).toHaveBeenCalled();
  });
});

// SPEC-025 — a position can be typed, as a percentage of the map image,
// wherever it can be clicked. Before this, the form offered fields only once
// a click had already set a position (TD-133's remaining half): the keyboard
// could open "Aggiungi luogo" at the map's centre and nothing else.
describe("MapPOIPanel — typed coordinates (SPEC-025)", () => {
  // A 1000×500 image: the south-west corner first, as Leaflet writes bounds.
  const mapCorners: [[number, number], [number, number]] = [
    [0, 0],
    [500, 1000],
  ];

  function openAddForm(extra: Record<string, unknown> = {}) {
    const props = { ...baseProps(), mapCorners, ...extra };
    render(<MapPOIPanel {...props} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));
    return props;
  }

  function positionFields() {
    return {
      across: screen.getByLabelText<HTMLInputElement>(
        "geography.poiPanel.fields.positionAcross"
      ),
      down: screen.getByLabelText<HTMLInputElement>(
        "geography.poiPanel.fields.positionDown"
      ),
    };
  }

  it("offers both fields before any click, with no position set", () => {
    openAddForm();

    const { across, down } = positionFields();
    expect(across.value).toBe("");
    expect(down.value).toBe("");
  });

  it("saves the position typed as percentages, converted to the stored pair", () => {
    const props = openAddForm();

    const { across, down } = positionFields();
    fireEvent.change(across, { target: { value: "25" } });
    fireEvent.change(down, { target: { value: "25" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      { target: { value: "Taverna del Gallo Robin" } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(props.onAddPOI).toHaveBeenCalledWith(
      "Taverna del Gallo Robin",
      375,
      250,
      expect.any(String),
      undefined
    );
  });

  it("reads a comma as the decimal separator, as an Italian keyboard writes it", () => {
    const props = openAddForm();

    const { across, down } = positionFields();
    fireEvent.change(across, { target: { value: "50,5" } });
    fireEvent.change(down, { target: { value: "50" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      { target: { value: "Mezzo" } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(props.onAddPOI).toHaveBeenCalledWith(
      "Mezzo",
      250,
      505,
      expect.any(String),
      undefined
    );
  });

  it("shows a map click as percentages of the image", () => {
    openAddForm({ initialLat: 375, initialLng: 250 });

    const { across, down } = positionFields();
    expect(across.value).toBe("25");
    expect(down.value).toBe("25");
  });

  it("refuses a half-filled pair, naming both fields", () => {
    const props = openAddForm();

    fireEvent.change(positionFields().across, { target: { value: "25" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      { target: { value: "Mezza posizione" } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(props.onAddPOI).not.toHaveBeenCalled();
    expect(
      screen.getByText("geography.poiPanel.errors.positionIncomplete")
    ).toBeInTheDocument();
  });

  it("refuses a value outside the image and does not save the old position", () => {
    const props = openAddForm({ initialLat: 375, initialLng: 250 });

    fireEvent.change(positionFields().across, { target: { value: "140" } });
    fireEvent.change(
      screen.getByPlaceholderText("geography.poiPanel.placeholders.placeName"),
      { target: { value: "Fuori mappa" } }
    );
    fireEvent.click(screen.getByText("geography.poiPanel.save.save"));

    expect(props.onAddPOI).not.toHaveBeenCalled();
    expect(
      screen.getByText("geography.poiPanel.errors.positionOutOfRange")
    ).toBeInTheDocument();
  });

  it("keeps a half-typed decimal in the field rather than rounding it away", () => {
    openAddForm({ initialLat: 375, initialLng: 250 });

    const { across } = positionFields();
    fireEvent.change(across, { target: { value: "63." } });

    expect(across.value).toBe("63.");
  });

  it("says why the fields are unavailable when no map image is loaded", () => {
    const props = baseProps();
    render(<MapPOIPanel {...props} />);
    fireEvent.click(screen.getByText("geography.poiPanel.addButton"));

    expect(
      screen.getByText("geography.poiPanel.position.unavailable")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("geography.poiPanel.fields.positionAcross")
    ).not.toBeInTheDocument();
  });
});
