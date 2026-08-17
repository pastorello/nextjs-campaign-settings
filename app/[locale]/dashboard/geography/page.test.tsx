import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const fetchRootPlace = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/fetchRootPlace", () => ({
  default: () => fetchRootPlace(),
}));

const countUnpositionedPlaces = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/countUnpositionedPlaces", () => ({
  default: () => countUnpositionedPlaces(),
}));

const fetchPlaceAncestryChain = vi.fn<(id: number) => unknown>();
vi.mock("@/app/lib/data/maps/fetchPlaceAncestryChain", () => ({
  default: (id: number) => fetchPlaceAncestryChain(id),
}));

vi.mock("@/app/ui/geography/GeographyExplorer", () => ({
  toStackEntry: (place: { id: number; title: string }) => ({
    id: place.id,
    title: place.title,
  }),
  default: ({
    root,
    unpositionedCount,
    initialStack,
  }: {
    root: { title: string };
    unpositionedCount: number;
    initialStack?: { id: number; title: string }[];
  }) => (
    <div
      data-testid="geography-explorer"
      data-unpositioned={unpositionedCount}
      data-initial-stack={
        initialStack ? initialStack.map((entry) => entry.title).join(">") : ""
      }
    >
      {root.title}
    </div>
  ),
}));

import GeographyPage, { generateMetadata } from "./page";

describe("dashboard geography Page (SPEC-004 M7)", () => {
  it("titles the page from the geography.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-world prompt on an empty installation, not the explorer", async () => {
    fetchRootPlace.mockResolvedValue(null);

    render(await GeographyPage());

    expect(screen.queryByTestId("geography-explorer")).not.toBeInTheDocument();
    expect(screen.getByText("noWorldYet")).toBeInTheDocument();
    expect(screen.getByText("createWorldLink")).toHaveAttribute(
      "href",
      "/dashboard/world"
    );
    // No tree to count on an empty installation (SPEC-007 §5 edge cases).
    expect(countUnpositionedPlaces).not.toHaveBeenCalled();
  });

  it("renders the tree explorer once a root exists, with the unpositioned count", async () => {
    fetchRootPlace.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "aerivel.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });
    countUnpositionedPlaces.mockResolvedValue(42);

    render(await GeographyPage());

    expect(screen.getByTestId("geography-explorer")).toHaveTextContent(
      "Aerivel"
    );
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-unpositioned",
      "42"
    );
  });
});

describe("dashboard geography Page — ?place= landing (SPEC-011 T4)", () => {
  const root = {
    id: 1,
    title: "Aerivel",
    mapImage: "aerivel.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
  };

  beforeEach(() => {
    fetchRootPlace.mockResolvedValue(root);
    countUnpositionedPlaces.mockResolvedValue(42);
    fetchPlaceAncestryChain.mockReset();
  });

  it("passes no initial stack when ?place= is absent, preserving today's root-only behaviour", async () => {
    render(await GeographyPage({ searchParams: Promise.resolve({}) }));

    expect(fetchPlaceAncestryChain).not.toHaveBeenCalled();
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });

  it("resolves the ancestry chain and passes it as the initial stack when ?place= is a nested place", async () => {
    fetchPlaceAncestryChain.mockResolvedValue([
      { id: 1, title: "Aerivel" },
      { id: 2, title: "Kingdom of Kang" },
    ]);

    render(
      await GeographyPage({ searchParams: Promise.resolve({ place: "2" }) })
    );

    expect(fetchPlaceAncestryChain).toHaveBeenCalledWith(2);
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      "Aerivel>Kingdom of Kang"
    );
  });

  it("falls back to root-only navigation when ?place= doesn't resolve to a real place", async () => {
    fetchPlaceAncestryChain.mockResolvedValue(null);

    render(
      await GeographyPage({ searchParams: Promise.resolve({ place: "999" }) })
    );

    expect(fetchPlaceAncestryChain).toHaveBeenCalledWith(999);
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });

  it("falls back to root-only navigation on a garbage, non-numeric ?place= value, without querying", async () => {
    render(
      await GeographyPage({
        searchParams: Promise.resolve({ place: "not-a-number" }),
      })
    );

    expect(fetchPlaceAncestryChain).not.toHaveBeenCalled();
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });
});
