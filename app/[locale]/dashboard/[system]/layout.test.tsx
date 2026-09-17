import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/ui/dashboard/sidenav", () => ({
  default: () => <nav data-testid="sidenav" />,
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import Layout from "./layout";

async function renderLayout(system: string) {
  const ui = await Layout({
    params: Promise.resolve({ locale: "it", system }),
    children: <p>page content</p>,
  });
  return render(ui);
}

describe("dashboard Layout", () => {
  it("renders the side nav alongside its children for a known system", async () => {
    await renderLayout("dnd5e");

    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("is a 404 for a system that is not in GAME_SYSTEMS (ADR-0013 rule 2)", async () => {
    await expect(renderLayout("foo")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  // TD-88: the sidebar's own column now scrolls (see sidenav.test.tsx), but
  // the page-level column must still not — only the content pane does.
  it("keeps the page-level column from scrolling; only the content pane does", async () => {
    const { container } = await renderLayout("dnd5e");

    const pageColumn = container.firstElementChild;
    expect(pageColumn).toHaveClass("md:overflow-hidden");

    const contentPane = screen.getByText("page content").parentElement;
    expect(contentPane).toHaveClass("md:overflow-y-auto");
  });
});
