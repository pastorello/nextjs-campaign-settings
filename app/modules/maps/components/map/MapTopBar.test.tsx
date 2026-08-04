import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapTopBar } from "./MapTopBar";

describe("MapTopBar", () => {
  it("renders one pill per category", () => {
    render(<MapTopBar />);

    expect(screen.getByText("Restaurants")).toBeInTheDocument();
    expect(screen.getByText("Hotels")).toBeInTheDocument();
    expect(screen.getByText("Attractions")).toBeInTheDocument();
    expect(screen.getByText("Transit")).toBeInTheDocument();
  });

  it("calls onCategoryClick with the clicked category's id", () => {
    const onCategoryClick = vi.fn();
    render(<MapTopBar onCategoryClick={onCategoryClick} />);

    screen.getByText("Hotels").click();

    expect(onCategoryClick).toHaveBeenCalledWith("hotels");
  });

  it("does not throw when clicked without an onCategoryClick handler", () => {
    render(<MapTopBar />);

    expect(() => screen.getByText("Restaurants").click()).not.toThrow();
  });
});
