import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/app/ui/geography/GeographyExplorer", () => ({
  default: ({
    root,
    unpositionedCount,
  }: {
    root: { title: string };
    unpositionedCount: number;
  }) => (
    <div data-testid="geography-explorer" data-unpositioned={unpositionedCount}>
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
