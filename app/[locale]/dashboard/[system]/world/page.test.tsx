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

import WorldPage, { generateMetadata } from "./page";

describe("world Page (SPEC-004 M4)", () => {
  it("titles the page from the world.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-world form and nothing else on an empty installation", async () => {
    fetchRootPlace.mockResolvedValue(null);

    render(await WorldPage());

    expect(screen.getByTestId("create-world-form")).toBeInTheDocument();
  });

  it("does not offer the create-world form once a root exists", async () => {
    fetchRootPlace.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "uploaded-id.png",
    });

    render(await WorldPage());

    expect(screen.queryByTestId("create-world-form")).not.toBeInTheDocument();
    expect(screen.getByText('exists {"title":"Aerivel"}')).toBeInTheDocument();
  });
});
