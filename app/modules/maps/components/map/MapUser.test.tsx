import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

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

import { MapUser } from "./MapUser";

function openMenu() {
  const trigger = screen.getByRole("button");
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}

beforeEach(() => {
  vi.clearAllMocks();
  themeState = { theme: "light", mounted: true };
});

describe("MapUser", () => {
  it("renders a trigger button", () => {
    render(<MapUser />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens the menu and shows the GitHub link and Close Maps item", async () => {
    render(<MapUser />);
    openMenu();

    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Close Maps")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("navigates home when Close Maps is clicked", async () => {
    render(<MapUser />);
    openMenu();

    const closeMaps = await screen.findByText("Close Maps");
    fireEvent.click(closeMaps);

    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows Dark Mode label with a disabled toggle before mount", async () => {
    themeState = { theme: "light", mounted: false };
    render(<MapUser />);
    openMenu();

    const item = await screen.findByText("Dark Mode");
    expect(item.closest('[role="menuitem"]')).toHaveAttribute(
      "data-disabled",
      ""
    );
  });

  it("shows Light Mode label once mounted and theme is dark", async () => {
    themeState = { theme: "dark", mounted: true };
    render(<MapUser />);
    openMenu();

    expect(await screen.findByText("Light Mode")).toBeInTheDocument();
  });

  it("toggles theme when the mobile theme item is clicked", async () => {
    themeState = { theme: "light", mounted: true };
    render(<MapUser />);
    openMenu();

    const item = await screen.findByText("Dark Mode");
    fireEvent.click(item);

    expect(toggleTheme).toHaveBeenCalled();
  });
});
