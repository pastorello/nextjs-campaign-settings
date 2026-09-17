import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SectionTitle from "./SectionTitle";

describe("SectionTitle", () => {
  it("renders its children as an h2", () => {
    render(<SectionTitle>Avventure</SectionTitle>);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Avventure",
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-lg", "font-bold");
  });

  it("merges an extra className with the shared style rather than replacing it", () => {
    render(<SectionTitle className="mb-3">Budget</SectionTitle>);

    const heading = screen.getByRole("heading", { level: 2, name: "Budget" });
    expect(heading).toHaveClass("text-lg", "font-bold", "mb-3");
  });
});
