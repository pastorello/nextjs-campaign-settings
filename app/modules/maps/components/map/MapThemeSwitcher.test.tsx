import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const toggleTheme = vi.fn();
let themeState: { theme: string; mounted: boolean } = {
  theme: "light",
  mounted: true,
};

vi.mock("@/app/modules/maps/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: themeState.theme,
    toggleTheme,
    mounted: themeState.mounted,
  }),
}));

import { MapThemeSwitcher } from "./MapThemeSwitcher";

beforeEach(() => {
  vi.clearAllMocks();
  themeState = { theme: "light", mounted: true };
});

describe("MapThemeSwitcher", () => {
  it("renders an unlabeled placeholder button before mount", () => {
    themeState.mounted = false;
    render(<MapThemeSwitcher />);

    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-label");
  });

  it("shows the moon icon and dark-mode label when currently light", () => {
    themeState = { theme: "light", mounted: true };
    render(<MapThemeSwitcher />);

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" })
    ).toBeInTheDocument();
  });

  it("shows the sun icon and light-mode label when currently dark", () => {
    themeState = { theme: "dark", mounted: true };
    render(<MapThemeSwitcher />);

    expect(
      screen.getByRole("button", { name: "Switch to light mode" })
    ).toBeInTheDocument();
  });

  it("calls toggleTheme when clicked", () => {
    render(<MapThemeSwitcher />);

    screen.getByRole("button").click();

    expect(toggleTheme).toHaveBeenCalled();
  });
});
