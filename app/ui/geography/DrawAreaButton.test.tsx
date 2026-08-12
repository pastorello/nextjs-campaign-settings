import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DrawAreaButton from "./DrawAreaButton";

// `next-intl` is mocked globally in vitest.setup.ts to echo the key back.

describe("DrawAreaButton", () => {
  it("shows the trigger label when not drawing", () => {
    render(<DrawAreaButton isDrawing={false} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "trigger" })).toBeInTheDocument();
  });

  it("shows the active label while drawing", () => {
    render(<DrawAreaButton isDrawing onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "active" })).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<DrawAreaButton isDrawing={false} onToggle={onToggle} />);

    screen.getByRole("button").click();

    expect(onToggle).toHaveBeenCalled();
  });
});
