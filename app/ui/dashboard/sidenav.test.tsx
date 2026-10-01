import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("./nav-links", () => ({
  default: ({ player }: { player?: boolean }) => (
    <div data-testid="nav-links" data-player={String(player ?? false)} />
  ),
}));
vi.mock("./CampaignSelector", () => ({
  default: ({ currentId }: { currentId: number | null }) => (
    <div data-testid="campaign-selector">{currentId}</div>
  ),
}));
vi.mock("./LocaleSwitcher", () => ({
  default: () => <div data-testid="locale-switcher" />,
}));
vi.mock("./SystemSwitcher", () => ({
  default: () => <div data-testid="system-switcher" />,
}));
vi.mock("../icons/CampaignSettingsLogo", () => ({
  default: () => <div data-testid="logo" />,
}));

import type { ViewerCampaign } from "@/app/lib/auth/Viewer";

import SideNav from "./sidenav";

const dm = { kind: "dm" as const, userId: "1" };
const rovine: ViewerCampaign = { id: 1, title: "Rovine", system: "dnd5e" };
const marea: ViewerCampaign = { id: 2, title: "Marea", system: "daggerheart" };

// TD-88: the sidebar sat inside a layout column where nothing in the chain
// scrolled, so once the nav grew past the viewport, sign-out and the locale
// switcher were clipped away with no way to reach them.
describe("SideNav", () => {
  it("makes its own column scroll, so items past the viewport stay reachable (TD-88)", async () => {
    const { container } = render(await SideNav({ viewer: dm }));

    const scrollContainer = container.firstElementChild;
    expect(scrollContainer).toHaveClass("h-full");
    expect(scrollContainer).toHaveClass("md:overflow-y-auto");
  });

  it("keeps sign-out and the locale switcher pinned to the bottom via a growing spacer when the nav list is short", async () => {
    render(await SideNav({ viewer: dm }));

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

    // The system switch, the locale switcher and the sign-out form come after
    // the spacer, in that order, so they land at the bottom of the column.
    const systemSwitcher = spacer?.nextElementSibling;
    expect(systemSwitcher).toBe(screen.getByTestId("system-switcher"));
    expect(systemSwitcher?.nextElementSibling).toBe(
      screen.getByTestId("locale-switcher")
    );
  });

  it("renders the sign-out button inside a form that submits the sign-out action", async () => {
    render(await SideNav({ viewer: dm }));

    expect(screen.getByRole("button", { name: "signOut" })).toBeInTheDocument();
  });

  // TD-137: the sidebar had no nav or header landmark, only plain divs — a
  // screen reader user had no quick way to jump to or skip it.
  it("wraps the nav links in a labelled nav landmark", async () => {
    render(await SideNav({ viewer: dm }));

    const nav = screen.getByRole("navigation", { name: "sidebarLabel" });
    expect(nav).toContainElement(screen.getByTestId("nav-links"));
  });
});

// SPEC-022 T7: a player's sidebar.
describe("SideNav for a player", () => {
  const player = (campaigns: ViewerCampaign[], current = campaigns[0]) => ({
    kind: "player" as const,
    userId: "2",
    campaigns,
    campaign: current ?? null,
  });

  it("offers the player's pages, not the system switch", async () => {
    render(await SideNav({ viewer: player([rovine]) }));

    expect(screen.getByTestId("nav-links")).toHaveAttribute(
      "data-player",
      "true"
    );
    expect(screen.queryByTestId("system-switcher")).not.toBeInTheDocument();
  });

  it("has no campaign selector with a single campaign", async () => {
    render(await SideNav({ viewer: player([rovine]) }));

    expect(screen.queryByTestId("campaign-selector")).not.toBeInTheDocument();
  });

  it("offers the campaign selector with two campaigns, on the current one", async () => {
    render(
      await SideNav({
        viewer: player([rovine, marea], marea),
      })
    );

    expect(screen.getByTestId("campaign-selector")).toHaveTextContent("2");
  });

  it("keeps the DM's system switch and full links", async () => {
    render(await SideNav({ viewer: dm }));

    expect(screen.getByTestId("nav-links")).toHaveAttribute(
      "data-player",
      "false"
    );
    expect(screen.getByTestId("system-switcher")).toBeInTheDocument();
  });
});
