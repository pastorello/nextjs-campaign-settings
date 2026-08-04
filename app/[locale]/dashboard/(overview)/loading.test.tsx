import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../ui/skeletons", () => ({
  default: () => <div data-testid="dashboard-skeleton" />,
}));

import Loading from "./loading";

describe("dashboard overview Loading", () => {
  it("renders the dashboard skeleton", () => {
    render(<Loading />);

    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
  });
});
