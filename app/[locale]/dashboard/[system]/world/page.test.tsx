import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: Record<string, string>) =>
      values ? `${key} ${JSON.stringify(values)}` : key
    ),
}));

const fetchRootPlace = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/fetchRootPlace", () => ({
  default: () => fetchRootPlace(),
}));

vi.mock("@/app/ui/geography/CreateWorldForm", () => ({
  default: () => <div data-testid="create-world-form" />,
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

import WorldPage, { generateMetadata } from "./page";

const params = Promise.resolve({ locale: "it", system: "dnd5e" });
const searchParams = Promise.resolve({});

describe("world Page (SPEC-004 M4)", () => {
  it("titles the page from the world.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-world form and nothing else on an empty installation", async () => {
    fetchRootPlace.mockResolvedValue(null);

    render(await WorldPage({ params, searchParams }));

    expect(screen.getByTestId("create-world-form")).toBeInTheDocument();
  });

  it("does not offer the create-world form once a root exists, and links to the map instead (TD-119)", async () => {
    fetchRootPlace.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "uploaded-id.png",
    });

    render(await WorldPage({ params, searchParams }));

    expect(screen.queryByTestId("create-world-form")).not.toBeInTheDocument();
    expect(screen.getByText('exists {"title":"Aerivel"}')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewMapLink" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/geography"
    );
  });

  it.each([null, { id: 1, title: "Aerivel", mapImage: "uploaded-id.png" }])(
    "links to the date systems panel under the route's system and the history (SPEC-014 T3, T5), root %#",
    async (root) => {
      fetchRootPlace.mockResolvedValue(root);

      render(await WorldPage({ params, searchParams }));

      expect(
        screen.getByRole("link", { name: "calendarLink" })
      ).toHaveAttribute("href", "/dashboard/dnd5e/world/calendar");
      expect(screen.getByRole("link", { name: "historyLink" })).toHaveAttribute(
        "href",
        "/dashboard/dnd5e/world/history"
      );
    }
  );
});
