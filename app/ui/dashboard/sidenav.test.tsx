import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));
vi.mock("./nav-links", () => ({
  default: () => <div data-testid="nav-links" />,
}));
vi.mock("./LocaleSwitcher", () => ({
  default: () => <div data-testid="locale-switcher" />,
}));
vi.mock("../icons/CampaignSettingsLogo", () => ({
  default: () => <div data-testid="logo" />,
}));

import SideNav from "./sidenav";

// TD-88: the sidebar sat inside a layout column where nothing in the chain
// scrolled, so once the nav grew past the viewport, sign-out and the locale
// switcher were clipped away with no way to reach them.
describe("SideNav", () => {
  it("makes its own column scroll, so items past the viewport stay reachable (TD-88)", async () => {
    const { container } = render(await SideNav());

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveClass("h-full");
    expect(scrollContainer).toHaveClass("md:overflow-y-auto");
  });

  it("keeps sign-out and the locale switcher pinned to the bottom via a growing spacer when the nav list is short", async () => {
    render(await SideNav());

    // The content column grows to fill the h-full container...
    const navLinks = screen.getByTestId("nav-links");
    const contentColumn = navLinks.parentElement;
    expect(contentColumn).toHaveClass("grow");

    // ...and the spacer between the nav links and the bottom controls grows
    // too, pushing the locale switcher and sign-out button to the bottom
    // regardless of how short the nav list is — this is the pinning
    // mechanism the overflow fix must not disturb.
    const spacer = navLinks.nextElementSibling;
    expect(spacer).toHaveClass("grow");

    // Locale switcher and the sign-out form come after the spacer, in that
    // order, so they land at the bottom of the column.
    expect(spacer?.nextElementSibling).toBe(
      screen.getByTestId("locale-switcher")
    );
  });

  it("renders the sign-out button inside a form that submits the sign-out action", async () => {
    render(await SideNav());

    expect(screen.getByRole("button", { name: "signOut" })).toBeInTheDocument();
  });
});
