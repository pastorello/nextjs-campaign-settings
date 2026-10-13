import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { count: number }) =>
    values ? `${key}:${values.count}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import CampaignList from "./CampaignList";

const campaigns = [
  {
    id: 4,
    title: "The Silver Coast",
    synopsis: "<p>A <strong>shadow</strong> falls.</p>",
    partySize: 5,
    adventureCount: 3,
  },
  {
    id: 9,
    title: "The Silver Coast",
    synopsis: null,
    partySize: 4,
    adventureCount: 0,
  },
];

describe("CampaignList (SPEC-032 T2)", () => {
  it("renders one card per campaign, each linking to its own page", () => {
    render(<CampaignList campaigns={campaigns} system="dnd5e" />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard/dnd5e/campaign/4",
      "/dashboard/dnd5e/campaign/9",
    ]);
  });

  it("shows the players and adventures, and the synopsis as plain words", () => {
    render(<CampaignList campaigns={campaigns} system="dnd5e" />);

    const [first] = screen.getAllByRole("link");
    expect(first).toHaveTextContent("players:5");
    expect(first).toHaveTextContent("adventures:3");
    expect(first).toHaveTextContent("A shadow falls.");
    expect(first?.innerHTML).not.toContain("<strong>");
  });

  it("links under the route system", () => {
    render(<CampaignList campaigns={campaigns} system="daggerheart" />);

    expect(screen.getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/campaign/4"
    );
  });
});
