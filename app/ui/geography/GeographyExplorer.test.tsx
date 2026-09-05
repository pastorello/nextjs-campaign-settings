import { act, render, screen } from "@testing-library/react";
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

interface CapturedWorldMapProps {
  parentId: number;
  ancestorIds: number[];
  placeTitle: string;
  parentTitle: string;
  isRoot: boolean;
  mapUrl: string;
  bounds: unknown;
  initialView: unknown;
  initialZoom: number;
  onDescend: (child: {
    id: number;
    title: string;
    lat: number;
    lng: number;
    mapImage: string | null;
    mapBounds: unknown;
    mapInitialView: unknown;
    mapInitialZoom: number | null;
    gridColumns: number | null;
    gridScale: string | null;
  }) => void;
  gridColumns: number | null;
  gridScale: string | null;
  onMapChanged: (mapImage: string) => void;
  onGridChanged: (gridColumns: number, gridScale: string) => void;
  onDeleted: () => void;
  unpositionedCount: number;
}

let capturedProps: CapturedWorldMapProps | null = null;
vi.mock("@/app/ui/geography/WorldMap", () => ({
  default: (props: CapturedWorldMapProps) => {
    capturedProps = props;
    return <div data-testid="world-map">{props.mapUrl}</div>;
  },
}));

import GeographyExplorer from "./GeographyExplorer";
import toStackEntry from "@/app/modules/maps/lib/utils/toStackEntry";

const root = {
  id: 1,
  title: "Aerivel",
  mapImage: "aerivel.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  gridColumns: null,
  gridScale: null,
};

const kang = {
  id: 2,
  title: "Kingdom of Kang",
  lat: 5,
  lng: 5,
  mapImage: "kang.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  gridColumns: null,
  gridScale: null,
};

const skreebars = {
  id: 3,
  title: "Skreebars",
  lat: 5,
  lng: 5,
  mapImage: "skreebars.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  gridColumns: null,
  gridScale: null,
};

const cieli = {
  id: 4,
  title: "Cieli",
  lat: 5,
  lng: 5,
  mapImage: null,
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  gridColumns: null,
  gridScale: null,
};

function descend(child: typeof kang | typeof cieli) {
  act(() => {
    capturedProps?.onDescend(child);
  });
}

function ascend() {
  act(() => {
    screen.getByText("up").click();
  });
}

describe("GeographyExplorer — unpositioned count (SPEC-007 T2; moved off the header by TD-85)", () => {
  it("no longer renders the count as its own header label", () => {
    render(<GeographyExplorer root={root} unpositionedCount={42} />);

    // The bare count/plural string used to render directly in the header;
    // TD-85 moved it into the context menu's "Posiziona luogo" entry
    // instead — a label with no action attached to it was noise (DM,
    // 2026-08-18).
    expect(screen.queryByText("unpositionedCount")).not.toBeInTheDocument();
  });

  it("passes the count straight through to WorldMap, whatever its value", () => {
    render(<GeographyExplorer root={root} unpositionedCount={42} />);
    expect(capturedProps?.unpositionedCount).toBe(42);

    render(<GeographyExplorer root={root} unpositionedCount={0} />);
    expect(capturedProps?.unpositionedCount).toBe(0);
  });
});

describe("GeographyExplorer — layout never scrolls the header out of view (usability fix)", () => {
  it("sizes itself to its parent's height and lets the map take the remaining space, not its own full viewport", () => {
    const { container } = render(
      <GeographyExplorer root={root} unpositionedCount={7} />
    );

    // The old bug: this wrapper's map child was `h-screen` (100% of the
    // *whole* viewport) stacked underneath the header, so header height +
    // a full 100vh map always exceeded the dashboard's own scrollable
    // content pane — pushing the header (and the "up" button on it, once
    // descended) above the fold. `h-full` here means "fill whatever
    // height the parent actually has," so header + map together can never
    // exceed it.
    const outer = container.firstElementChild;
    expect(outer).toHaveClass("flex", "h-full", "flex-col");

    const header = screen.getByText("Aerivel").closest("div.mb-4");
    expect(header).toHaveClass("flex-none");

    const mapWrapper = container.querySelector(".relative.w-full");
    expect(mapWrapper).toHaveClass("flex-1", "min-h-0");
    expect(mapWrapper).not.toHaveClass("h-screen");
  });
});

describe("GeographyExplorer — the up button stays reachable while descending (TD-83)", () => {
  it("anchors the up button to the map overlay, not inside the header row that can scroll away", () => {
    const { container } = render(
      <GeographyExplorer root={root} unpositionedCount={7} />
    );

    descend(kang);

    const upButton = screen.getByText("up");
    // The old bug: "up" lived in the header row (`div.mb-4`), which scrolls
    // out of view along with the rest of the dashboard's page chrome once
    // the map pushes the column taller than the viewport (TD-84). It must
    // now live inside the map's own overlay container instead, the same
    // one `MapControls`/`MapTileSwitcher` float in.
    const header = screen.getByText("Kingdom of Kang").closest("div.mb-4");
    const mapWrapper = container.querySelector(
      ".relative.w-full.flex-1.min-h-0"
    );

    expect(header?.contains(upButton)).toBe(false);
    expect(mapWrapper?.contains(upButton)).toBe(true);
  });
});

describe("GeographyExplorer (SPEC-004 M7)", () => {
  it("renders the root's own map and title, no up button", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/api/maps/aerivel.png/image"
    );
    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(capturedProps?.parentId).toBe(1);
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("hands the map its own ancestor chain, growing as the DM descends (SPEC-017 T8)", () => {
    render(<GeographyExplorer root={root} unpositionedCount={0} />);

    // The stack is the chain, itself last — which is exactly the set of
    // places that must not be offered as placeable on this map, since each
    // of them contains it.
    expect(capturedProps?.ancestorIds).toEqual([root.id]);

    descend(kang);

    expect(capturedProps?.ancestorIds).toEqual([root.id, kang.id]);
  });

  it("descends into a navigable child, replacing the map and title", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/api/maps/kang.png/image"
    );
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();
    expect(capturedProps?.parentId).toBe(2);
  });

  it("shows the up button once descended, and ascends back to the root on click", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);
    expect(screen.getByText("up")).toBeInTheDocument();

    ascend();

    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("descends two levels and returns to the root one step at a time", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);
    descend(skreebars);

    expect(screen.getByText("Skreebars")).toBeInTheDocument();

    ascend();
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();

    ascend();
    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("marks the root as root, with no parent to name", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    expect(capturedProps?.isRoot).toBe(true);
    expect(capturedProps?.parentTitle).toBe("");
  });

  it("marks a descended place as not-root, naming its parent (SPEC-010 T3)", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);

    expect(capturedProps?.isRoot).toBe(false);
    expect(capturedProps?.placeTitle).toBe("Kingdom of Kang");
    expect(capturedProps?.parentTitle).toBe("Aerivel");
  });

  it("names the grandparent, not the immediate parent's own parent, two levels down", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);
    descend(skreebars);

    expect(capturedProps?.parentTitle).toBe("Kingdom of Kang");
  });

  it("pops the stack like ascend when WorldMap reports the place was deleted", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();

    act(() => {
      capturedProps?.onDeleted();
    });

    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("falls back to the default bounds/view/zoom when the place has none stored", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    expect(capturedProps?.bounds).toEqual([
      [0, 0],
      [2000, 2000],
    ]);
    expect(capturedProps?.initialView).toEqual([1000, 1000]);
    expect(capturedProps?.initialZoom).toBe(-2);
  });

  it("descends into a mapless child with a blank mapUrl (SPEC-007 T1)", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(cieli);

    expect(screen.getByTestId("world-map")).toHaveTextContent("");
    expect(screen.getByText("Cieli")).toBeInTheDocument();
    expect(capturedProps?.parentId).toBe(4);
  });

  it("patches the current place's map after WorldMap reports it changed", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(cieli);
    expect(screen.getByTestId("world-map")).toHaveTextContent("");

    act(() => {
      capturedProps?.onMapChanged("cieli.png");
    });

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/api/maps/cieli.png/image"
    );
    // Still on the same place, not pushed as a new stack entry.
    expect(screen.getByText("Cieli")).toBeInTheDocument();
    expect(screen.queryByText("up")).toBeInTheDocument();
  });

  it("patches the current place's grid after WorldMap reports it configured (SPEC-015 T5)", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    descend(kang);
    expect(capturedProps?.gridColumns).toBeNull();

    act(() => {
      capturedProps?.onGridChanged(36, "kingdom");
    });

    expect(capturedProps?.gridColumns).toBe(36);
    expect(capturedProps?.gridScale).toBe("kingdom");
    // Still on the same place, not pushed as a new stack entry.
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();

    // Ascending discards the patch's target with its entry — the root's own
    // grid is untouched.
    act(() => {
      screen.getByText("up").click();
    });
    expect(capturedProps?.gridColumns).toBeNull();
  });
});

describe("GeographyExplorer — initial stack (SPEC-011 T4)", () => {
  it("behaves exactly as today when no initial stack is given: starts at the root, no up button", () => {
    render(<GeographyExplorer root={root} unpositionedCount={7} />);

    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(capturedProps?.parentId).toBe(1);
    expect(capturedProps?.isRoot).toBe(true);
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("starts on the given place's map, with the up button available", () => {
    const initialStack = [toStackEntry(root), toStackEntry(kang)];

    render(
      <GeographyExplorer
        root={root}
        unpositionedCount={7}
        initialStack={initialStack}
      />
    );

    expect(screen.getByTestId("world-map")).toHaveTextContent(
      "/api/maps/kang.png/image"
    );
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();
    expect(capturedProps?.parentId).toBe(2);
    expect(capturedProps?.isRoot).toBe(false);
    expect(capturedProps?.parentTitle).toBe("Aerivel");
    expect(screen.getByText("up")).toBeInTheDocument();
  });

  it("ascends the given trail one step at a time, back to the chain's root", () => {
    const initialStack = [
      toStackEntry(root),
      toStackEntry(kang),
      toStackEntry(skreebars),
    ];

    render(
      <GeographyExplorer
        root={root}
        unpositionedCount={7}
        initialStack={initialStack}
      />
    );

    expect(screen.getByText("Skreebars")).toBeInTheDocument();

    ascend();
    expect(screen.getByText("Kingdom of Kang")).toBeInTheDocument();

    ascend();
    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });

  it("lands directly on the root with a single-entry initial stack, no up button", () => {
    const initialStack = [toStackEntry(root)];

    render(
      <GeographyExplorer
        root={root}
        unpositionedCount={7}
        initialStack={initialStack}
      />
    );

    expect(screen.getByText("Aerivel")).toBeInTheDocument();
    expect(capturedProps?.isRoot).toBe(true);
    expect(screen.queryByText("up")).not.toBeInTheDocument();
  });
});
