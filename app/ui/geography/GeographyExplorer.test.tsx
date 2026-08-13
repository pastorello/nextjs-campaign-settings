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
  }) => void;
  onMapChanged: (mapImage: string) => void;
  onDeleted: () => void;
}

let capturedProps: CapturedWorldMapProps | null = null;
vi.mock("@/app/ui/geography/WorldMap", () => ({
  default: (props: CapturedWorldMapProps) => {
    capturedProps = props;
    return <div data-testid="world-map">{props.mapUrl}</div>;
  },
}));

import GeographyExplorer from "./GeographyExplorer";

const root = {
  id: 1,
  title: "Aerivel",
  mapImage: "aerivel.png",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
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

describe("GeographyExplorer — unpositioned count (SPEC-007 T2)", () => {
  it("renders the count beside the title", () => {
    render(<GeographyExplorer root={root} unpositionedCount={42} />);

    expect(screen.getByText("unpositionedCount")).toBeInTheDocument();
  });

  it("still renders when every place is positioned, rather than hiding", () => {
    render(<GeographyExplorer root={root} unpositionedCount={0} />);

    expect(screen.getByText("unpositionedCount")).toBeInTheDocument();
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
});
