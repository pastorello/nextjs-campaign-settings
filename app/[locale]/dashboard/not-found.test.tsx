import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

import NotFound from "./not-found";

describe("dashboard NotFound", () => {
  it("renders the title, description and a link back to the dashboard", async () => {
    render(await NotFound());

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("goBack")).toHaveAttribute("href", "/dashboard");
  });
});
