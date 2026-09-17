import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/ui/dashboard/sidenav", () => ({
  default: () => <nav data-testid="sidenav" />,
}));

import Layout from "./layout";

describe("dashboard Layout", () => {
  it("renders the side nav alongside its children", () => {
    render(
      <Layout>
        <p>page content</p>
      </Layout>
    );

    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  // TD-88: the sidebar's own column now scrolls (see sidenav.test.tsx), but
  // the page-level column must still not — only the content pane does.
  it("keeps the page-level column from scrolling; only the content pane does", () => {
    const { container } = render(
      <Layout>
        <p>page content</p>
      </Layout>
    );

    const pageColumn = container.firstElementChild;
    expect(pageColumn).toHaveClass("md:overflow-hidden");

    const contentPane = screen.getByText("page content").parentElement;
    expect(contentPane).toHaveClass("md:overflow-y-auto");
  });
});
