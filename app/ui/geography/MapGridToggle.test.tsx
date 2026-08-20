import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import MapGridToggle from "./MapGridToggle";

const onToggle = vi.fn();
const onConfigure = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// The global next-intl mock (vitest.setup.ts) returns the raw key handed to
// `t()`, so labels assert on "show"/"hide"/"configure", not catalogue copy.
describe("MapGridToggle", () => {
  it("toggles when a grid is configured, and labels the action it would take", () => {
    const { rerender } = render(
      <MapGridToggle
        isConfigured
        isVisible={false}
        onToggle={onToggle}
        onConfigure={onConfigure}
      />
    );

    const button = screen.getByTitle("show");
    expect(button).toHaveAttribute("aria-pressed", "false");
    button.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onConfigure).not.toHaveBeenCalled();

    rerender(
      <MapGridToggle
        isConfigured
        isVisible
        onToggle={onToggle}
        onConfigure={onConfigure}
      />
    );
    expect(screen.getByTitle("hide")).toHaveAttribute("aria-pressed", "true");
  });

  it("is inert without a configured grid — it offers configuration instead of guessing (SPEC-015 §5)", () => {
    render(
      <MapGridToggle
        isConfigured={false}
        isVisible={false}
        onToggle={onToggle}
        onConfigure={onConfigure}
      />
    );

    screen.getByTitle("configure").click();
    expect(onConfigure).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
