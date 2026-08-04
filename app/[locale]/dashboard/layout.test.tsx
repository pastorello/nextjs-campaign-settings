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
});
